<script lang="ts">
  import Factor from "./Factor.svelte";

  interface Props {
    factorIds: number[];
  }

  const { factorIds }: Props = $props();
</script>

<div class="d-flex flex-wrap gap-1">
  {#each factorIds as factorId}
    <Factor {factorId} />
  {/each}
</div>
