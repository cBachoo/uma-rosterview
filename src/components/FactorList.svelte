<script lang="ts">
    import Factor from "./Factor.svelte";
    import { factorsData } from "../data";

    interface Props {
        factorIds: number[];
        filters: {
            blues: { [key: string]: boolean | number; stars: number };
            reds: { [key: string]: boolean | number; stars: number };
            greens: { stars: number };
            whites: { [key: string]: boolean | number; stars: number };
        };
    }
    const { factorIds, filters }: Props = $props();
</script>

<div class="d-flex flex-wrap gap-1">
    {#each factorIds.filter((id) => factorsData[id]) as factorId}
        <Factor {factorId} {filters} />
    {/each}
</div>
