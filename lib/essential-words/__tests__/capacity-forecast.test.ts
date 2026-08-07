import { describe, expect, it } from "vitest";
import {
  buildCapacityForecast,
  forecastActiveSessionCapacities,
} from "../capacity-forecast";
import type {
  CapacityReservation,
  ForecastCapacityDemand,
  ForecastSessionCapacity,
} from "../planning-types";

function sessions(seconds = 100): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: seconds,
    listeningSeconds: seconds,
    productionSeconds: seconds,
  }));
}

describe("forecastActiveSessionCapacities", () => {
  it("cuenta ocho sesiones activas y no ocho días naturales", () => {
    const calendar = [
      true, false, false, true, false, true, false, false, true,
      false, true, false, false, true, false, true, false, false, true, false, true,
    ];

    const forecast = forecastActiveSessionCapacities(calendar, 0, 900);

    expect(forecast).toHaveLength(8);
    expect(forecast.map((slot) => slot.sessionOffset)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(forecast.every((slot) => slot.availableSeconds === 900)).toBe(true);
  });
});

describe("buildCapacityForecast", () => {
  it("descuenta obligatorios, luego base pendiente y conserva reservas previas", () => {
    const mandatory: ForecastCapacityDemand[] = [{
      itemId: "c1k:due#meaning",
      skill: "meaning",
      deadlineSession: 1,
      estimatedSeconds: 60,
    }];
    const pendingBase: CapacityReservation[] = [{
      itemId: "c1k:base#listening",
      source: "pending-base",
      skill: "listening",
      deadlineSession: 8,
      estimatedSeconds: 40,
    }];
    const previous: CapacityReservation[] = [{
      itemId: "c1k:reserved#production",
      source: "new-word",
      skill: "production",
      deadlineSession: 8,
      estimatedSeconds: 50,
    }];

    const result = buildCapacityForecast({
      sessions: sessions(),
      mandatory,
      pendingBase,
      futureReservations: previous,
    });

    expect(result.status).toBe("ready");
    expect(result.sessions[0]).toMatchObject({
      availableSeconds: 0,
      listeningSeconds: 0,
    });
    expect(result.reservations.map((reservation) => reservation.itemId)).toEqual([
      "c1k:base#listening",
      "c1k:reserved#production",
    ]);
    expect(result.reservations[1].deadlineSession).toBe(2);
  });

  it("marca forecast insuficiente cuando no existen ocho slots activos", () => {
    const result = buildCapacityForecast({
      sessions: sessions().slice(0, 7),
      mandatory: [],
      pendingBase: [],
      futureReservations: [],
    });

    expect(result).toMatchObject({ status: "insufficient-forecast" });
  });

  it("una reserva previa más temprana no se posterga al regenerar pending-base", () => {
    const previous: CapacityReservation = {
      itemId: "c1k:kept#listening",
      source: "new-word",
      skill: "listening",
      deadlineSession: 1,
      estimatedSeconds: 20,
    };
    const regenerated: CapacityReservation = {
      ...previous,
      source: "pending-base",
      deadlineSession: 8,
    };

    const result = buildCapacityForecast({
      sessions: sessions(),
      mandatory: [],
      pendingBase: [regenerated],
      futureReservations: [previous],
    });

    expect(result.reservations[0]).toMatchObject({
      source: "new-word",
      deadlineSession: 1,
    });
  });
});
