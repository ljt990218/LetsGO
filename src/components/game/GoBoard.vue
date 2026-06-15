<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  watch
} from 'vue'
import type {
  BoardPoint,
  GamePhase,
  GameSnapshot
} from '../../types/go'
import { WgoBoardAdapter } from '../../services/wgoBoardAdapter'

const props = defineProps<{
  snapshot: GameSnapshot
  phase: GamePhase
}>()

const emit = defineEmits<{
  point: [point: BoardPoint]
}>()

const boardHost = useTemplateRef<HTMLElement>('boardHost')
let adapter: WgoBoardAdapter | null = null

onMounted(() => {
  if (!boardHost.value) {
    return
  }

  adapter = new WgoBoardAdapter(
    boardHost.value,
    Math.sqrt(props.snapshot.intersections.length),
    point => emit('point', point)
  )
  adapter.sync(props.snapshot)
})

watch(
  () => props.snapshot,
  nextSnapshot => adapter?.sync(nextSnapshot)
)

onBeforeUnmount(() => {
  adapter?.destroy()
  adapter = null
})
</script>

<template>
  <section
    class="board-stage"
    :class="`board-stage-${phase}`"
  >
    <div class="board-frame">
      <div
        ref="boardHost"
        class="wgo-board-host"
      />
      <div class="board-grain" />
    </div>

    <div
      v-if="phase === 'scoring'"
      class="scoring-ribbon"
    >
      <span>终局数子</span>
      点击棋子标记或取消死子
    </div>

    <div
      v-if="phase === 'finished'"
      class="finished-seal"
    >
      <span>终</span>
    </div>
  </section>
</template>

<style scoped>
.board-stage {
  position: relative;
  display: grid;
  width: min(72vh, calc(100vw - 470px));
  min-width: 580px;
  aspect-ratio: 1;
  place-items: center;
  animation: board-arrive 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.board-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 1px solid rgb(227 199 143 / 48%);
  border-radius: 3px;
  background:
    linear-gradient(135deg, rgb(255 239 195 / 18%), transparent 18%),
    linear-gradient(145deg, #bd8d51, #a97640);
  box-shadow:
    0 35px 80px rgb(0 0 0 / 46%),
    0 7px 16px rgb(0 0 0 / 44%),
    inset 0 0 0 8px rgb(68 43 20 / 16%),
    inset 0 0 35px rgb(255 224 153 / 15%);
}

.wgo-board-host {
  position: relative;
  z-index: 1;
  width: 100%;
  aspect-ratio: 1;
}

.wgo-board-host :deep(> div),
.wgo-board-host :deep(svg) {
  width: 100% !important;
  height: 100% !important;
}

.wgo-board-host :deep(> div > div:first-child) {
  border: 0 !important;
}

.board-grain {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    repeating-linear-gradient(
      3deg,
      transparent 0,
      transparent 16px,
      rgb(79 42 14 / 4%) 17px,
      transparent 19px
    ),
    radial-gradient(circle at 22% 18%, rgb(255 239 197 / 10%), transparent 32%);
  mix-blend-mode: multiply;
}

.scoring-ribbon {
  position: absolute;
  right: -18px;
  bottom: 32px;
  z-index: 3;
  display: grid;
  gap: 2px;
  border-left: 2px solid #c8a76a;
  background: rgb(20 22 18 / 92%);
  padding: 12px 16px;
  color: #a7a596;
  font-size: 10px;
  letter-spacing: 0.12em;
  box-shadow: 0 10px 30px rgb(0 0 0 / 30%);
}

.scoring-ribbon span {
  color: #e0bf7e;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 14px;
  letter-spacing: 0.2em;
}

.finished-seal {
  position: absolute;
  right: -22px;
  bottom: 22px;
  z-index: 3;
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  border: 2px solid #8f3d32;
  color: #b34f42;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 28px;
  transform: rotate(-8deg);
  opacity: 0.9;
}

@keyframes board-arrive {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
