// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CapabilityPreflight } from '../CapabilityPreflight'

vi.mock('@/lib/speech/adapters/webSpeechAdapter', () => ({
  isWebSpeechReliable: () => true,
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition
  delete (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  Object.defineProperty(navigator, 'permissions', {
    value: originalPermissions,
    configurable: true,
  })
  Object.defineProperty(navigator, 'mediaDevices', {
    value: originalMediaDevices,
    configurable: true,
  })
  Object.defineProperty(window, 'isSecureContext', {
    value: originalSecureContext,
    configurable: true,
  })
})

const originalPermissions = navigator.permissions
const originalMediaDevices = navigator.mediaDevices
const originalSecureContext = window.isSecureContext

// jsdom's `window` and `document` are linked — replacing the whole `window`
// global (as `hooks/__tests__/useVoiceRecorder.test.ts` does for a plain
// node environment) breaks `render()` here. Instead patch only the specific
// properties this component reads, and restore them in `afterEach`.
function stubGlobals(opts: {
  hasSpeechRecognition?: boolean
  onLine?: boolean
  permissionState?: 'granted' | 'denied' | 'prompt'
  permissionsUnavailable?: boolean
  microphoneCaptureUnavailable?: boolean
  secureContext?: boolean
}) {
  const {
    hasSpeechRecognition = true,
    onLine = true,
    permissionState = 'granted',
    permissionsUnavailable = false,
    microphoneCaptureUnavailable = false,
    secureContext = true,
  } = opts

  if (hasSpeechRecognition) {
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}
  }
  Object.defineProperty(navigator, 'onLine', { value: onLine, configurable: true })
  Object.defineProperty(navigator, 'permissions', {
    value: permissionsUnavailable
      ? undefined
      : { query: vi.fn().mockResolvedValue({ state: permissionState }) },
    configurable: true,
  })
  Object.defineProperty(navigator, 'mediaDevices', {
    value: microphoneCaptureUnavailable
      ? undefined
      : { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
    configurable: true,
  })
  Object.defineProperty(window, 'isSecureContext', {
    value: secureContext,
    configurable: true,
  })
}

describe('CapabilityPreflight', () => {
  it('shows the privacy explanation and a continue action when fully supported', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: true, permissionState: 'granted' })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    // Privacy explanation is present up front, before recording.
    expect(
      screen.getByText(/no.*guardamos.*audio|audio.*no.*se guarda/i)
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /empezar las preguntas/i })).toBeEnabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /empezar las preguntas/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
    const snapshot = onContinue.mock.calls[0][0]
    expect(snapshot.browserSupport).toBe('full')
    expect(snapshot.sttAvailable).toBe(true)
  })

  it('permission denied: still navigable via perception/self-report continue path', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: true, permissionState: 'denied' })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(screen.getByText(/activa el micrófono en el navegador/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /continuar sin micrófono/i })
    expect(continueButton).toBeEnabled()
    await userEvent.click(continueButton)
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onContinue.mock.calls[0][0].micPermission).toBe('denied')
  })

  it('offers microphone activation first when permission is still prompt', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: true, permissionState: 'prompt' })
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] })
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)
    const activateButton = await screen.findByRole('button', {
      name: /activar micrófono/i,
    })
    await userEvent.click(activateButton)

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(onContinue).not.toHaveBeenCalled()

    const continueButton = screen.getByRole('button', { name: /empezar las preguntas/i })
    await userEvent.click(continueButton)
    expect(onContinue.mock.calls[0][0].micPermission).toBe('granted')
  })

  it('rechecks a denied permission and enables production after the browser setting changes', async () => {
    stubGlobals({ hasSpeechRecognition: true, permissionState: 'denied' })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)
    const retryButton = await screen.findByRole('button', {
      name: /ya lo permití: comprobar/i,
    })
    await userEvent.click(retryButton)

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /empezar las preguntas/i })).toBeEnabled()
  })

  it('updates automatically when the permission changes in Chrome', async () => {
    stubGlobals({ hasSpeechRecognition: true, permissionState: 'denied' })
    const listeners = new Set<() => void>()
    const permissionStatus = {
      state: 'denied' as PermissionState,
      addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
    }
    Object.defineProperty(navigator, 'permissions', {
      value: { query: vi.fn().mockResolvedValue(permissionStatus) },
      configurable: true,
    })

    render(<CapabilityPreflight onContinue={vi.fn()} />)
    await screen.findByText(/activa el micrófono en el navegador/i)

    permissionStatus.state = 'granted'
    listeners.forEach((listener) => listener())

    expect(
      await screen.findByRole('button', { name: /empezar las preguntas/i })
    ).toBeEnabled()
  })

  it('confirms when Chrome still has the permission blocked', async () => {
    stubGlobals({ hasSpeechRecognition: true, permissionState: 'denied' })
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new DOMException('blocked', 'NotAllowedError')),
      },
      configurable: true,
    })

    render(<CapabilityPreflight onContinue={vi.fn()} />)
    await userEvent.click(
      await screen.findByRole('button', { name: /ya lo permití: comprobar/i })
    )

    expect(await screen.findByRole('status')).toHaveTextContent(/sigue bloqueado en chrome/i)
  })

  it('explains that a LAN HTTP address on mobile cannot access the microphone', async () => {
    stubGlobals({
      hasSpeechRecognition: true,
      permissionState: 'denied',
      microphoneCaptureUnavailable: true,
      secureContext: false,
    })

    render(<CapabilityPreflight onContinue={vi.fn()} />)

    expect(
      await screen.findByText(/en el celular abre la app con HTTPS/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /ya lo permití: comprobar/i })
    ).not.toBeInTheDocument()
  })

  it('unsupported browser: still navigable via perception/self-report continue path', async () => {
    stubGlobals({ hasSpeechRecognition: false, onLine: true })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(screen.getByText(/no pudimos evaluar tu pronunciaci[oó]n/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /continuar sin micrófono/i })
    expect(continueButton).toBeEnabled()
    await userEvent.click(continueButton)
    expect(onContinue.mock.calls[0][0].browserSupport).toBe('unsupported')
  })

  it('offline: still navigable, sttAvailable forced false', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: false, permissionState: 'granted' })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(screen.getByText(/no pudimos evaluar tu pronunciaci[oó]n/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /continuar sin micrófono/i })
    expect(continueButton).toBeEnabled()
    await userEvent.click(continueButton)
    expect(onContinue.mock.calls[0][0].sttAvailable).toBe(false)
  })

  it('evaluator unavailable (permissions API missing, treated as unknown, but sttAvailable still computed): remains navigable', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: true, permissionsUnavailable: true })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /activar micrófono/i })
      ).toBeEnabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /activar micrófono/i }))
    expect(onContinue).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /empezar las preguntas/i }))
    expect(onContinue.mock.calls[0][0].micPermission).toBe('granted')
  })
})
