<script lang="ts">
  import type { CharaData } from "../types";
  import Chara from "../components/Chara.svelte";

  interface Props {
    trainedCharas: CharaData[];
  }
  const { trainedCharas }: Props = $props();
</script>

<div class="row row-cols-1 row-cols-lg-2 g-5">
  {#each trainedCharas as chara (chara.chara_seed)}
    <div class="col">
      <Chara charaData={chara}></Chara>
    </div>
  {/each}
</div>

<style>
  .skill-icon {
    object-fit: cover;
    border: 1px solid #dee2e6;
  }

  .skill-icon:hover {
    transform: scale(1.1);
    transition: transform 0.2s;
  }
</style>
