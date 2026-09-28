<script>
import { defineComponent, ref, reactive, toRef, computed } from 'vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

export default defineComponent({
    components: {
        MdEditor,
    },
    props: {
        value: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
        const dataContainer = reactive({});
        const value = computed({
            get() {
                return props.value;
            },
            set(value_) {
                if (props.disabled) return;
                emit('update:value', value_);
            },
        });
        return {
            value,
            dataContainer,
        };
    },
});
</script>

<template>
    <MdEditor v-model="value" theme="dark" />
</template>
