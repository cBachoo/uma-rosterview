<script lang="ts">
  import { factorsData } from "../data";

  const { factorId } = $props<{ factorId: number }>();
  const factor = $derived(factorsData[factorId]);
  const factorName = $derived(
    factor ? factor.name : `Unknown Factor (${factorId})`,
  );
  const factorStars = $derived("★".repeat(factor?.rarity || 0));
</script>

<span class="badge text-bg-secondary">
  {factorName}
  <span style="color: gold;">{factorStars}</span>
</span>
