<script setup>
import { ref } from 'vue'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';

const server = 'http://localhost:4000'

class RetriableError extends Error { }

class FatalError extends Error { }

const ctrl = new AbortController()
const token = ref("")
const message = ref("")

function handleLogin() {
  fetch(server + '/auth/login', { method: "POST" }).then(res => res.json()).then(res => {
    const { access_token } = res;

    window.localStorage.setItem('token', access_token);
    token.value = access_token
  })
}

function handleSse() {
  createSse(server + '/stream')
}

async function createSse(url) {
  const token = window.localStorage.getItem("token")

  if (!token) return console.error("token not found")
  await fetchEventSource(url, {
    method: "GET",
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    signal: ctrl.signal,
    onclose() {
      console.log("onclose")
      // if the server closes the connection unexpectedly, retry:
      throw new RetriableError();
    },
    onerror(err) {
      console.log("onerror", err)
      if (err instanceof FatalError) {
        throw err; // rethrow to stop the operation
      } else {
        // do nothing to automatically retry. You can also
        // return a specific retry interval here.
      }
    },
    async onopen(response) {
      console.log("onopen", response)
      // console.log("response.headers.get('content-type')", response.headers.get('content-type'))
      if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
        return; // everything's good
      } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        // client-side errors are usually non-retriable:
        throw new FatalError();
      } else {
        throw new RetriableError();
      }
    },
    onmessage(evt) {
      try {
        console.log("onmessage", JSON.parse(String(evt.data)))
        message.value = message.value + evt.data.msg + '\n'
      } catch (err) {
        console.error(err)
      }
    }
  })
}

</script>

<template>
  <div>
    <div class="wrapper">
      <div>
        <div class="token-ui">
          <div class="gap"> <button @click="handleLogin">登录创建token</button>
            用户登录换取的token</div>
          <div>{{ token }}</div>
        </div>
      </div>
      <div>
        <div class="token-ui">
          <div class="gap"> <button @click="handleSse">创建sse连接</button>
            创建sse所调用的token</div>
          <div>{{ token }}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="token-ui" :style="{ width: '900px' }">
    <div class="gap">
      sse信息流
    </div>
    <div>{{ message }}</div>
  </div>
</template>

<style>
.token-ui {
  margin-bottom: 10px;

  background-color: #333333d3;
  font-weight: bold;
  border-radius: 20px;
  width: 500px;
  height: 200px;
  padding: 12px;
}

.wrapper {
  display: flex;
  column-gap: 20px;
}

.gap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  column-gap: 20px;
  row-gap: 20px;
  margin-bottom: 20px;
  font-size: 16px;
}
</style>