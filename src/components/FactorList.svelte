<script lang="ts">
    import Factor from "./Factor.svelte";
    import { factorsData } from "../data";

    interface Props {
        factorIds: number[];
    }
    const { factorIds }: Props = $props();
</script>

<div class="d-flex flex-wrap gap-1">
    {#each factorIds.filter((id) => factorsData[id]) as factorId}
        <Factor {factorId} />
    {/each}
</div>
