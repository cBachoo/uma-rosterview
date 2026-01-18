<script lang="ts">
    import Logo from "./assets/cafe.png";
    import TrainedCharaList from "./pages/TrainedCharaList.svelte";
    import Upload from "./pages/Upload.svelte";
    import UnifiedTopBar from "./components/UnifiedTopBar.svelte";
    import {
        decodeCharas,
        getEncodedFromUrl,
        clearUrlEncoding,
    } from "./encoding";

    import type { CharaData } from "./types";

    let trainedCharas: CharaData[] | undefined = $state();
    let showImportModal = $state(false);
    let importText = $state("");
    let importError = $state("");

    // Check URL hash on load - run once
    const urlEncoded = getEncodedFromUrl();
    if (urlEncoded) {
        console.log(
            "Found URL hash, attempting decode...",
            urlEncoded.substring(0, 50),
        );
        const imported = decodeCharas(urlEncoded);
        console.log("Decoded characters:", imported.length);
        if (imported.length > 0) {
            trainedCharas = imported;
        }
    }

    // Only load dev data if no URL import happened
    if (import.meta.env.DEV && !trainedCharas) {
        const loader = import.meta.glob("../data.json")["../data.json"];
        if (loader) {
            loader().then((resp) => {
                let data = resp as { default: CharaData[] };
                trainedCharas = data.default;
            });
        }
    }

    function handleImport() {
        showImportModal = true;
        importText = "";
        importError = "";
    }

    function processImport() {
        try {
            let encoded = importText.trim();
            console.log("Processing import:", encoded.substring(0, 50));
            if (encoded.includes("#")) {
                encoded = encoded.split("#")[1];
            }
            console.log("Extracted hash:", encoded.substring(0, 50));
            const imported = decodeCharas(encoded);
            console.log("Decoded characters:", imported.length, imported);
            if (imported.length === 0) {
                importError = "No valid characters found in the link";
                return;
            }
            trainedCharas = imported;
            showImportModal = false;
        } catch (err) {
            console.error("Import error:", err);
            importError = "Invalid link format";
        }
    }

    function closeImportModal() {
        showImportModal = false;
    }

    function goHome() {
        trainedCharas = undefined;
        clearUrlEncoding();
    }
</script>

{#if !trainedCharas}
    <UnifiedTopBar currentApp="sparks" />
{/if}

<main class="container container-fluid text-center">
    {#if trainedCharas}
        <TrainedCharaList {trainedCharas} onHome={goHome}></TrainedCharaList>
    {:else}
        <div class="text-center py-4">
            <h1 class="display-5 fw-bold text-body-emphasis">
                Umamusume Roster Viewer
            </h1>
            <img src={Logo} class="logo" alt="Vite Logo" />
            <p class="display">cafe my beautiful schizophrenic wife....</p>
        </div>
        <Upload
            uploaddata={(data: CharaData[]) => (trainedCharas = data)}
            onImport={handleImport}
        />
    {/if}

    <!-- Import Modal -->
    {#if showImportModal}
        <div class="modal-backdrop fade show" onclick={closeImportModal}></div>
        <div class="modal fade show d-block" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Import Characters</h5>
                        <button
                            type="button"
                            class="btn-close"
                            onclick={closeImportModal}
                        ></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="importInput" class="form-label"
                                >Paste the shared link:</label
                            >
                            <input
                                type="text"
                                class="form-control"
                                id="importInput"
                                bind:value={importText}
                                placeholder="https://...#encoded-data"
                            />
                        </div>
                        <div class="alert alert-info mb-0">
                            <small
                                ><strong>Note:</strong> Import currently only includes
                                sparks (factors). Stats and skills are not preserved
                                in shared links.</small
                            >
                        </div>
                        {#if importError}
                            <div class="alert alert-warning mt-3 mb-0">
                                {importError}
                            </div>
                        {/if}
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            onclick={closeImportModal}>Cancel</button
                        >
                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick={processImport}>Import</button
                        >
                    </div>
                </div>
            </div>
        </div>
    {/if}
</main>

<style>
    .title {
        font-size: 64px;
        text-align: center;
    }

    .logo {
        transform: scale(0.8);
    }

    p {
        opacity: 10%;
    }
</style>
