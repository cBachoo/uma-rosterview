<script lang="ts">
    import glueLogo from "./assets/glue.png";
    import TrainedCharaList from "./pages/TrainedCharaList.svelte";
    import Upload from "./pages/Upload.svelte";

    import type { CharaData } from "./types";

    let trainedCharas: CharaData[] | undefined = $state();
    if (import.meta.env.DEV) {
        const loader = import.meta.glob("../data.json")["../data.json"];
        if (loader) {
            loader().then((resp) => {
                let data = resp as { default: CharaData[] };
                trainedCharas = data.default;
            });
        }
    }
</script>

<main class="container container-fluid text-center">
    {#if trainedCharas}
        <TrainedCharaList {trainedCharas}></TrainedCharaList>
    {:else}
        <div class="text-center py-4">
            <h1 class="display-5 fw-bold text-body-emphasis">Glue Factory</h1>
            <img src={glueLogo} class="logo" alt="Vite Logo" />
        </div>
        <Upload uploaddata={(data: CharaData[]) => (trainedCharas = data)} />
    {/if}
</main>

<style>
    .title {
        font-size: 64px;
        text-align: center;
    }

    .logo {
        transform: scale(0.9);
    }
</style>
