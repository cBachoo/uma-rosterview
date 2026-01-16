<script lang="ts">
    import { factorsData } from "../data";

    const { factorId } = $props<{ factorId: number }>();
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
</script>

<span class={badgeClass}>
    {factorName}
    <span style="color: gold;">{factorStars}</span>
</span>
