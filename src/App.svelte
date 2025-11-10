<script lang="ts">
  import veteranLogo from "./assets/veteran.png";
  import TrainedCharaList from "./pages/TrainedCharaList.svelte";
  import Upload from "./pages/Upload.svelte";

  import type { CharaData } from "./types";

  let trainedCharas: CharaData[] | undefined = $state();
  let files: FileList | null = $state(null);
  $effect(() => {
    if (files) {
    }
  });
</script>

<main class="container container-fluid text-center">
  <div class="my-4 text-center">
    <h1 class="display-5 fw-bold text-body-emphasis">
      Uma Ground<strike style="font-size: 14px;">work</strike>
    </h1>
    <img src={veteranLogo} class="logo" alt="Vite Logo" />
  </div>
  {#if trainedCharas}
    <TrainedCharaList {trainedCharas}></TrainedCharaList>
  {/if}
  <Upload uploaddata={(data: CharaData[]) => (trainedCharas = data)} />
</main>

<style>
  .title {
    font-size: 64px;
    text-align: center;
  }
</style>
