<script lang="ts">
    import Logo from "./assets/cafe.png";
    import TrainedCharaList from "./pages/TrainedCharaList.svelte";
    import Affinity from "./pages/Affinity.svelte";
    import Upload from "./pages/Upload.svelte";
    import UnifiedTopBar from "./components/UnifiedTopBar.svelte";
    import {
        decodeCharas,
        getEncodedFromUrl,
        clearUrlEncoding,
    } from "./encoding";

    import type { CharaData } from "./types";

    let trainedCharas: CharaData[] | undefined = $state();
    let currentPage = $state<"roster" | "affinity">("roster");
    let showImportModal = $state(false);
    let importText = $state("");
    let importError = $state("");

    // Parse hash for routing and data
    function parseHash() {
        const hash = window.location.hash.slice(1); // Remove #

        // Check if it's a route
        if (hash.startsWith("/affinity")) {
            currentPage = "affinity";
            return null;
        } else if (hash.startsWith("/")) {
            currentPage = "roster";
            return null;
        }

        // Otherwise treat as encoded data
        currentPage = "roster";
        return hash || null;
    }

    // Check URL hash on load - run once (async)
    const urlEncoded = parseHash();
    if (urlEncoded) {
        console.log(
            "Found URL hash, attempting decode...",
            urlEncoded.substring(0, 50),
        );
        decodeCharas(urlEncoded).then((imported) => {
            console.log("Decoded characters:", imported.length);
            if (imported.length > 0) {
                trainedCharas = imported;
            }
        });
    }

    // Listen for hash changes
    function handleHashChange() {
        const hash = window.location.hash.slice(1);
        if (hash.startsWith("/affinity")) {
            currentPage = "affinity";
        } else if (hash.startsWith("/")) {
            currentPage = "roster";
        } else {
            // Empty hash or encoded data - show roster
            currentPage = "roster";
        }
    }

    if (typeof window !== "undefined") {
        window.addEventListener("hashchange", handleHashChange);
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

    async function processImport() {
        try {
            let encoded = importText.trim();
            console.log("Processing import:", encoded.substring(0, 50));
            if (encoded.includes("#")) {
                encoded = encoded.split("#")[1];
            }
            console.log("Extracted hash:", encoded.substring(0, 50));
            const imported = await decodeCharas(encoded);
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
        window.location.hash = "";
        currentPage = "roster";
    }

    function showAffinityPage() {
        window.location.hash = "/affinity";
    }

    function showRosterPage() {
        window.location.hash = "";
        currentPage = "roster";
    }
</script>

{#if !trainedCharas}
    <UnifiedTopBar currentApp="sparks" />
{/if}

<main class="container container-fluid text-center">
    {#if trainedCharas}
        {#if currentPage === "affinity"}
            <Affinity {trainedCharas}></Affinity>
        {:else}
            <TrainedCharaList
                {trainedCharas}
                onHome={goHome}
                onAffinityClick={showAffinityPage}
            ></TrainedCharaList>
        {/if}
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
                                ><strong>Note:</strong> Shared links include all character
                                data: stats, skills, sparks (factors), and parents. Links
                                are automatically compressed for shorter URLs.</small
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
