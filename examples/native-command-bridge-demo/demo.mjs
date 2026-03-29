import {
  createNativeCommandBridge,
} from '../../packages/native-command-bridge-core/dist/index.js';

const bridge = createNativeCommandBridge(
  {
    async invoke(command, payload) {
      if (command === 'get_status') {
        return { status: 'ok', payload };
      }
      throw { code: 'unsupported_command', message: `Unsupported command: ${command}` };
    },
    subscribe(eventName, listener) {
      listener({ eventName, sequence: 1 });
      return () => {};
    },
  },
  {
    defaultRetries: 1,
  }
);

const invokeResult = await bridge.invoke({
  command: 'get_status',
  payload: { source: 'demo' },
});

const subscribeResult = await bridge.subscribe('clipboard-update', (event) => {
  process.stdout.write(`${JSON.stringify({ observedEvent: event })}\n`);
});

console.log(
  JSON.stringify(
    {
      capabilities: bridge.getCapabilities(),
      invokeResult,
      subscribeResult: {
        ok: subscribeResult.ok,
      },
    },
    null,
    2
  )
);
