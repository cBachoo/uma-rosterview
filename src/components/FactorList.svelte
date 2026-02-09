<script lang="ts">
    import Factor from "./Factor.svelte";
    import { factorsData } from "../data";

    interface Props {
        factorIds: number[];
        filters: {
            blues: { [key: string]: boolean | number; stars: number };
            reds: { [key: string]: boolean | number; stars: number };
            greens: { stars: number };
            whites: { [key: string]: number };
        };
    }
    const { factorIds, filters }: Props = $props();

    // Sort factors by type: blue (1) > red (2) > green (3) > white (4/5/6)
    const sortedFactorIds = $derived(
        factorIds
            .filter((id) => factorsData[id])
            .sort((a, b) => {
                const factorA = factorsData[a];
                const factorB = factorsData[b];

                // Map types to sort order: 1=blue, 2=red, 3=green, 4/5/6=white
                const typeA = factorA?.type ?? 99;
                const typeB = factorB?.type ?? 99;

                // For white factors (types 4, 5, 6), normalize to 4 for sorting
                const sortTypeA = typeA > 3 ? 4 : typeA;
                const sortTypeB = typeB > 3 ? 4 : typeB;

                return sortTypeA - sortTypeB;
            }),
    );
</script>

<div class="d-flex flex-wrap gap-1">
    {#each sortedFactorIds as factorId}
        <Factor {factorId} {filters} />
    {/each}
</div>
