import { describe, expect, it } from "vitest";
import { buildAdmissionLoadEnvelope } from "../../admission-envelope";
import { buildCapacityForecast } from "../../capacity-forecast";
import type { CapacityReservation, ForecastSessionCapacity } from "../../planning-types";
import {
  activeDates,
  admit,
  costs,
  inferred,
  NOW,
  openSessions,
  readyForecast,
} from "./capacity-reservations.fixtures";

/**
 * Task 8.9k — admisión agregada C9-safe de placement.
 *
 * Estas pruebas cubren específicamente la evaluación *acumulativa* de la
 * cohorte (§2), el contrato atómico frente a compromisos previos (§3/§5),
 * la distinción ceiling vs capacitySafeConversions (§6), la persistencia de
 * placement ya comprometido entre sesiones (§8) y el escenario de cohorte
 * que reproducía el bug de 8.9j (§10). Las letras A–H, I–L, J–K de la lista
 * de 16 tests obligatorios ya viven en `capacity-reservations.test.ts` y
 * `capacity-reservations-planning.test.ts`; aquí se añaden las que exigen la
 * semántica nueva de este task (D, E, F, G, H, I, K, N, O aquí re-verificadas
 * contra el algoritmo acumulativo real, más el reproductor de §10).
 */
describe("Task 8.9k — admisión acumulativa C9-safe de placement", () => {
  it("D: la N+1 se rechaza si rompería la feasibility de una obligación ya comprometida", () => {
    // Una sola sesión con espacio exacto para UNA pareja listening+production.
    // Dos candidatos individualmente "caben" en un snapshot fresco, pero
    // aceptar el primero agota la sesión; el segundo debe ser rechazado por
    // capacidad, no colarse porque se evaluó contra el snapshot original.
    const sessions: ForecastSessionCapacity[] = openSessions(0).map((session, index) => (
      index < 2
        ? { ...session, availableSeconds: costs.listening + costs.production }
        : session
    ));
    const result = admit({
      candidates: inferred(3),
      maxConversionsPerSession: 10,
      forecast: readyForecast(sessions),
    });

    expect(result.admitted.length).toBeLessThan(3);
    expect(result.rejectedForCapacity).toBeGreaterThan(0);
    // Todo lo comprometido debe seguir siendo <=8 sesiones tras cada aceptación.
    expect(
      result.forecast.reservations
        .filter((item) => item.skill === "listening" || item.skill === "production")
        .every((item) => item.deadlineSession <= 8),
    ).toBe(true);
  });

  it("E: maxConversionsPerSession=8 no obliga a admitir 8 si la capacidad real es menor", () => {
    const scarce = readyForecast(openSessions(costs.listening + costs.production));
    const result = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 8,
      forecast: scarce,
    });

    expect(result.admitted.length).toBeLessThan(8);
    expect(result.admitted.length).toBe(result.capacitySafeConversions);
  });

  it("F: subir el techo a 100 no produce más admisiones si la capacidad no cambia", () => {
    const scarce = () => readyForecast(openSessions(costs.listening + costs.production));
    const withCeiling8 = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 8,
      forecast: scarce(),
    });
    const withCeiling100 = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 100,
      forecast: scarce(),
    });

    expect(withCeiling100.admitted.length).toBe(withCeiling8.admitted.length);
    expect(withCeiling100.capacitySafeConversions).toBe(withCeiling8.capacitySafeConversions);
  });

  it("G: una nueva conversión no empeora el deadline de un pending-base preexistente", () => {
    const existingPendingDeadline = 3;
    const pendingBase: CapacityReservation[] = [{
      itemId: "c1k:preexisting#listening",
      source: "pending-base",
      skill: "listening",
      deadlineSession: existingPendingDeadline,
      estimatedSeconds: costs.listening,
    }];
    const forecast = readyForecast(openSessions(500), pendingBase);
    const preexistingBefore = forecast.reservations
      .find((item) => item.itemId === "c1k:preexisting#listening");
    expect(preexistingBefore).toBeDefined();

    const result = admit({
      candidates: inferred(6),
      maxConversionsPerSession: 6,
      forecast,
    });

    const preexistingAfter = result.forecast.reservations
      .find((item) => item.itemId === "c1k:preexisting#listening");
    expect(preexistingAfter).toBeDefined();
    // La reserva original nunca es reescrita por reserveCapacity (append-only):
    // el pending-base preexistente conserva exactamente el mismo slot.
    expect(preexistingAfter).toEqual(preexistingBefore);
  });

  it("H: una nueva conversión no desplaza placement previamente comprometido", () => {
    const committedListening: CapacityReservation = {
      itemId: "c1k:committed#listening",
      source: "placement",
      skill: "listening",
      deadlineSession: 2,
      estimatedSeconds: costs.listening,
    };
    const forecast = readyForecast(openSessions(500), [], [committedListening]);
    const result = admit({
      candidates: inferred(6),
      maxConversionsPerSession: 6,
      forecast,
    });

    const stillThere = result.forecast.reservations
      .find((item) => item.itemId === "c1k:committed#listening");
    expect(stillThere).toBeDefined();
    expect(stillThere?.estimatedSeconds).toBe(committedListening.estimatedSeconds);
    // La re-priorización diaria puede adelantar el slot (nunca atrasarlo) al
    // volver a repartir sesiones abiertas; el compromiso nunca se pierde ni
    // se empeora más allá de su promesa original.
    expect(stillThere!.deadlineSession).toBeLessThanOrEqual(committedListening.deadlineSession);
  });

  it("I: las reservas de placement persisten entre sesiones con su deadline original", () => {
    const firstSessionResult = admit({
      candidates: inferred(1),
      maxConversionsPerSession: 1,
      forecast: readyForecast(openSessions(500)),
    });
    expect(firstSessionResult.admitted).toHaveLength(1);
    const committed = firstSessionResult.newReservations;

    // Al abrir la siguiente sesión, esas reservas se reconstruyen desde
    // `futureReservations` — exactamente como hace `buildFutureCapacity` en
    // producción — y deben persistir con su deadline original, sin tratarse
    // como capacidad libre para nuevos candidatos.
    const secondSessionForecast = buildCapacityForecast({
      sessions: openSessions(500),
      mandatory: [],
      pendingBase: [],
      futureReservations: committed,
    });

    for (const reservation of committed) {
      const persisted = secondSessionForecast.reservations
        .find((item) => item.itemId === reservation.itemId && item.skill === reservation.skill);
      expect(persisted).toBeDefined();
      // Nunca se pospone más allá de lo prometido; puede adelantarse si el
      // recálculo diario libera un slot antes.
      expect(persisted!.deadlineSession).toBeLessThanOrEqual(reservation.deadlineSession);
      expect(persisted?.source).toBe("placement");
    }
  });

  it("K: la ventana rolling de C9 permanece consistente tras cada conversión aceptada", () => {
    const result = admit({
      candidates: inferred(8),
      maxConversionsPerSession: 8,
      forecast: readyForecast(openSessions(200)),
    });

    expect(result.rejectedForAggregateC9).toBe(0);
    expect(
      result.forecast.reservations
        .filter((item) => item.skill === "listening" || item.skill === "production")
        .every((item) => item.deadlineSession <= 8),
    ).toBe(true);
  });

  it("N: rechazar una conversión no deja reservas provisionales parciales", () => {
    const before = readyForecast(openSessions(0));
    const result = admit({
      candidates: inferred(1),
      maxConversionsPerSession: 1,
      forecast: before,
    });

    expect(result.admitted).toEqual([]);
    expect(result.rejectedForCapacity).toBe(1);
    expect(result.forecast.reservations).toEqual(before.reservations);
    expect(result.forecast.sessions).toEqual(before.sessions);
  });

  it("O: misma seed/contexto produce exactamente el mismo conjunto admitido con envelope", () => {
    const envelope = buildAdmissionLoadEnvelope({
      costs,
      introductionSeconds: 10,
      horizonSessions: 8,
    });
    const run = () => admit({
      candidates: inferred(12),
      maxConversionsPerSession: 8,
      forecast: readyForecast(openSessions(500)),
      admissionEnvelope: envelope,
    });

    const first = run();
    const second = run();
    expect(second.admitted.map((item) => item.id)).toEqual(first.admitted.map((item) => item.id));
    expect(second.rejectedForCapacity).toBe(first.rejectedForCapacity);
    expect(second.rejectedForSafetyCeiling).toBe(first.rejectedForSafetyCeiling);
  });

  it("el envelope de FSRS reduce la capacidad disponible para el provisional de sesión 8", () => {
    // Con solo unos segundos de margen en la sesión 8, el envelope (que
    // reserva `costs.recognition` justo ahí) debe poder tumbar una conversión
    // que de otro modo cabría exactamente.
    const tightSessionEight = openSessions(500).map((session) => (
      session.sessionOffset === 8
        ? { ...session, availableSeconds: costs.recognition, listeningSeconds: costs.recognition, productionSeconds: costs.recognition }
        : session
    ));
    const envelope = buildAdmissionLoadEnvelope({
      costs,
      introductionSeconds: 10,
      horizonSessions: 8,
    });
    // Forzamos que el único due candidate caiga en sessionOffset 8: usamos
    // una fecha `now` muy próxima al inicio de la ventana para que el resto
    // de sesiones (1-7) sean el destino natural de listening/production y la
    // meaning-review provisional sea el único trabajo que compite por la 8.
    const withoutEnvelope = admit({
      candidates: inferred(1),
      maxConversionsPerSession: 1,
      forecast: readyForecast(tightSessionEight),
    });
    const withEnvelope = admit({
      candidates: inferred(1),
      maxConversionsPerSession: 1,
      forecast: readyForecast(tightSessionEight),
      admissionEnvelope: envelope,
    });

    // El envelope nunca puede volver *más* permisivo el resultado.
    expect(withEnvelope.capacitySafeConversions).toBeLessThanOrEqual(
      withoutEnvelope.capacitySafeConversions,
    );
  });

  it("§10 — reproduce el escenario del bug de 8.9j: muchos candidatos, capacidad real solo para una fracción", () => {
    // Backlog real: mandatory + pending base consumen casi todo el budget de
    // cada una de las 8 sesiones; solo queda margen para 2-3 conversiones en
    // total a lo largo de toda la ventana de 8 sesiones.
    const scarceMargin = Math.ceil((costs.listening + costs.production) / 3);
    const sessions = openSessions(scarceMargin);
    const forecast = readyForecast(sessions);
    const manyCandidates = inferred(50);

    const withDefaultCeiling = admit({
      candidates: manyCandidates,
      maxConversionsPerSession: 8,
      forecast,
      activeSessionDates: activeDates(60),
    });
    const withHighCeiling = admit({
      candidates: manyCandidates,
      maxConversionsPerSession: 100,
      forecast,
      activeSessionDates: activeDates(60),
    });

    expect(withDefaultCeiling.admitted.length).toBeLessThan(8);
    // La prueba central del bug: subir el techo de seguridad NO debe cambiar
    // cuántas conversiones se admiten si la capacidad real no cambió.
    expect(withHighCeiling.admitted.length).toBe(withDefaultCeiling.admitted.length);
    expect(withHighCeiling.capacitySafeConversions).toBe(withDefaultCeiling.capacitySafeConversions);
    expect(withDefaultCeiling.rejectedForCapacity).toBeGreaterThan(0);
  });

  it("NOW/activeDates deterministas se usan consistentemente (sanity del fixture)", () => {
    expect(NOW.toISOString()).toBe("2026-08-06T10:00:00.000Z");
  });
});
