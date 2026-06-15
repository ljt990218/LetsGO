<script setup lang="ts">
import { reactive, watch } from 'vue'
import type {
  BoardSize,
  GameSettings
} from '../../types/go'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  open: boolean
  initialSettings: GameSettings
}>()

const emit = defineEmits<{
  close: []
  start: [settings: GameSettings]
}>()

const form = reactive<GameSettings>({
  ...props.initialSettings
})

watch(
  () => props.open,
  open => {
    if (open) {
      Object.assign(form, props.initialSettings)
    }
  }
)

function submit(): void {
  emit('start', {
    blackName: form.blackName,
    whiteName: form.whiteName,
    boardSize: Number(form.boardSize) as BoardSize,
    komi: Number(form.komi)
  })
}
</script>

<template>
  <BaseModal
    :open="open"
    eyebrow="NEW LOCAL MATCH"
    title="新开一局"
    description="设置完成后将替换当前对局，并从黑方第一手开始。"
    closable
    @close="emit('close')"
  >
    <form
      class="dialog-form"
      @submit.prevent="submit"
    >
      <div class="name-grid">
        <label class="form-field">
          <span class="field-label">
            <i class="stone stone-black" />
            黑方
          </span>
          <input
            v-model="form.blackName"
            class="field-control"
            maxlength="18"
            autocomplete="off"
          >
        </label>

        <label class="form-field">
          <span class="field-label">
            <i class="stone stone-white" />
            白方
          </span>
          <input
            v-model="form.whiteName"
            class="field-control"
            maxlength="18"
            autocomplete="off"
          >
        </label>
      </div>

      <div class="rule-grid">
        <label class="form-field">
          <span class="field-label">棋盘路数</span>
          <select
            v-model="form.boardSize"
            class="field-control"
          >
            <option :value="19">十九路</option>
            <option :value="13">十三路</option>
            <option :value="9">九路</option>
          </select>
        </label>

        <label class="form-field">
          <span class="field-label">贴目</span>
          <input
            v-model.number="form.komi"
            class="field-control"
            type="number"
            step="0.5"
            required
          >
        </label>
      </div>

      <div class="rule-note">
        <span>中国规则</span>
        <b>数子法 · 位置超级劫</b>
      </div>

      <button
        type="submit"
        class="primary-action focus-ring"
      >
        落座开局
      </button>
    </form>
  </BaseModal>
</template>

<style scoped>
.dialog-form {
  display: grid;
  gap: 24px;
}

.name-grid,
.rule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-field {
  display: grid;
  gap: 9px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #b8b5a7;
  font-size: 12px;
  letter-spacing: 0.12em;
}

.stone {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.stone-black {
  background: #050505;
  box-shadow: inset 2px 2px 3px #4c4c4c;
}

.stone-white {
  border: 1px solid #bfbbae;
  background: #eee9dc;
}

.field-control {
  border-radius: 2px;
  font-size: 14px;
}

.rule-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #34362e;
  border-bottom: 1px solid #34362e;
  padding: 14px 0;
  color: #8f8e82;
  font-size: 11px;
  letter-spacing: 0.1em;
}

.rule-note b {
  color: #c8a76a;
  font-weight: 500;
}

.primary-action {
  border: 1px solid #c8a76a;
  border-radius: 2px;
  background: #c8a76a;
  padding: 13px 18px;
  color: #171711;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.22em;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.primary-action:hover {
  background: #e1c080;
  transform: translateY(-1px);
}
</style>
