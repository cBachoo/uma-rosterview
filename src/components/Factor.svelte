<script lang="ts">
    import { factorsData } from "../data";

    interface Props {
        factorId: number;
        filters: {
            blues: { [key: string]: boolean | number; stars: number };
            reds: { [key: string]: boolean | number; stars: number };
            greens: { stars: number };
            whites: { [key: string]: boolean | number; stars: number };
        };
    }
    const { factorId, filters }: Props = $props();

    const factor = $derived(factorsData[factorId]);
    const factorName = $derived(
        factor ? factor.name : `Unknown Factor (${factorId})`,
    );
    const factorStars = $derived("★".repeat(factor?.rarity || 0));
    const badgeClass = $derived(
        factor?.type === 1
            ? "badge text-bg-primary"
            : factor?.type === 2
              ? "badge text-bg-danger"
              : factor?.type === 3
                ? "badge text-bg-success"
                : "badge text-bg-secondary",
    );

    // Check if this factor matches any active filter
    const isHighlighted = $derived.by(() => {
        if (!factor) return false;

        const nameMap: Record<string, string> = {
            frontRunner: "Front Runner",
            paceChaser: "Pace Chaser",
            lateSurger: "Late Surger",
            endCloser: "End Closer",
        };

        // Check blues (type 1)
        if (factor.type === 1) {
            const key = factor.name.toLowerCase();
            if (filters.blues[key] && factor.rarity >= filters.blues.stars) {
                return true;
            }
        }

        // Check reds (type 2)
        if (factor.type === 2) {
            const selectedReds = Object.entries(filters.reds)
                .filter(([k, v]) => k !== "stars" && v)
                .map(([k]) => nameMap[k] || k.charAt(0).toUpperCase() + k.slice(1));
            if (selectedReds.includes(factor.name) && factor.rarity >= filters.reds.stars) {
                return true;
            }
        }

        // Check whites (type 4)
        if (factor.type === 4) {
            if (filters.whites[factor.name] && factor.rarity >= filters.whites.stars) {
                return true;
            }
        }

        return false;
    });
</script>

<span class={badgeClass} class:highlight={isHighlighted}>
    {factorName}
    <span style="color: gold;">{factorStars}</span>
</span>

<style>
    .highlight {
        border: 2px solid gold;
        box-shadow: 0 0 4px gold;
    }
</style>
