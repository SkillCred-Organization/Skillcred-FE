import assert from 'node:assert/strict'
import { test } from 'node:test'

async function setup() {
  const scripts = []
  const initializations = []
  const buttons = []
  const id = {
    initialize: options => initializations.push(options),
    renderButton: (parent, options) => buttons.push({ parent, options }),
  }
  globalThis.window = { setTimeout, clearTimeout }
  globalThis.document = {
    createElement: () => ({ remove() { this.removed = true } }),
    head: { appendChild: script => scripts.push(script) },
  }
  const module = await import('../src/lib/googleIdentity.ts?test=' + crypto.randomUUID())
  return { module, scripts, initializations, buttons, id,
    load: async () => {
      const loading = module.loadGoogleIdentity('test-client')
      window.google = { accounts: { id } }
      scripts.at(-1).onload()
      return loading
    },
  }
}

test('Google uses one shared SDK initialization and the button popup flow', async () => {
  const context = await setup()
  const first = context.module.loadGoogleIdentity('test-client')
  const second = context.module.loadGoogleIdentity('test-client')
  assert.equal(first, second)
  assert.equal(context.scripts.length, 1)
  assert.equal(context.scripts[0].src, 'https://accounts.google.com/gsi/client')
  window.google = { accounts: { id: context.id } }
  context.scripts[0].onload()
  await first
  assert.equal(context.initializations.length, 1)
  assert.equal(context.initializations[0].ux_mode, 'popup')
  assert.equal(context.initializations[0].auto_select, false)
})

test('a failed Google script load can be retried without reloading the page', async () => {
  const context = await setup()
  const failed = context.module.loadGoogleIdentity('test-client')
  context.scripts[0].onerror()
  await assert.rejects(failed, /Check your connection/)
  assert.equal(context.scripts[0].removed, true)
  await context.load()
  assert.equal(context.scripts.length, 2)
  assert.equal(context.initializations.length, 1)
})

test('missing Google configuration does not load a script', async () => {
  const context = await setup()
  await assert.rejects(context.module.loadGoogleIdentity(''), /not configured/)
  assert.equal(context.scripts.length, 0)
})

test('popup credentials reach only the originating mounted button', async () => {
  const context = await setup()
  const id = await context.load()
  const received = []
  const parent = { replaceChildren() {} }
  const oldButton = context.module.renderGoogleButton(id, parent, 'signin_with', credential => received.push(['old', credential]))
  oldButton.resize(478)
  const oldState = context.buttons[0].options.state
  assert.equal(context.buttons[0].options.width, 400)
  assert.equal(context.buttons[0].options.text, 'signin_with')
  oldButton.dispose()
  const newButton = context.module.renderGoogleButton(id, parent, 'continue_with', credential => received.push(['new', credential]))
  newButton.resize(335)
  const newState = context.buttons[1].options.state
  const callback = context.initializations[0].callback
  callback({ state: oldState, credential: 'stale-credential' })
  callback({ credential: 'unmatched-credential' })
  callback({ state: newState, credential: '' })
  assert.deepEqual(received, [])
  callback({ state: newState, credential: 'current-credential' })
  assert.deepEqual(received, [['new', 'current-credential']])
  newButton.resize(335)
  assert.equal(context.buttons.length, 2)
  newButton.resize(300)
  assert.equal(context.buttons[2].options.state, newState)
  newButton.dispose()
  callback({ state: newState, credential: 'late-credential' })
  assert.equal(received.length, 1)
})
