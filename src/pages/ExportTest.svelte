<script lang="ts">
    import type { CharaData } from "../types";
    import {
        encodeSingleUma,
        decodeSingleUma,
        charaToSingleExport,
        singleExportToChara,
    } from "../singleExport";

    let { trainedCharas }: { trainedCharas: CharaData[] } = $props();

    let selectedUmaIndex = $state<number | null>(null);
    let exportedCode = $state("");
    let importCode = $state("");
    let importError = $state("");
    let importedUma = $state<Partial<CharaData> | null>(null);
    let copySuccess = $state(false);

    function handleExport() {
        if (selectedUmaIndex === null) return;
        const uma = trainedCharas[selectedUmaIndex];
        const exportData = charaToSingleExport(uma);
        exportedCode = encodeSingleUma(exportData);
        copySuccess = false;
    }

    async function handleCopyCode() {
        try {
            await navigator.clipboard.writeText(exportedCode);
            copySuccess = true;
            setTimeout(() => (copySuccess = false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }

    function handleImport() {
        importError = "";
        importedUma = null;

        if (!importCode.trim()) {
            importError = "Please enter a code to import";
            return;
        }

        const decoded = decodeSingleUma(importCode.trim());
        if (!decoded) {
            importError = "Invalid code format";
            return;
        }

        importedUma = singleExportToChara(decoded);
    }

    function clearImport() {
        importCode = "";
        importError = "";
        importedUma = null;
    }
</script>

<div class="container py-4">
    <h2 class="mb-4">Single Uma Export/Import Test</h2>

    <div class="row g-4">
        <!-- Export Section -->
        <div class="col-lg-6">
            <div class="card shadow-sm h-100">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Export Uma</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="umaSelect" class="form-label"
                            >Select Uma to Export:</label
                        >
                        <select
                            class="form-select"
                            id="umaSelect"
                            bind:value={selectedUmaIndex}
                            onchange={handleExport}
                        >
                            <option value={null}>-- Select an Uma --</option>
                            {#each trainedCharas as uma, index}
                                <option value={index}>
                                    Card ID: {uma.card_id} | Speed: {uma.speed}
                                    | Skills: {uma.skill_array.length}
                                </option>
                            {/each}
                        </select>
                    </div>

                    {#if exportedCode}
                        <div class="mb-3">
                            <label for="exportCode" class="form-label"
                                >Export Code:</label
                            >
                            <div class="input-group">
                                <textarea
                                    class="form-control font-monospace"
                                    id="exportCode"
                                    rows="4"
                                    readonly
                                    value={exportedCode}
                                ></textarea>
                            </div>
                            <div class="d-flex gap-2 mt-2">
                                <button
                                    class="btn btn-sm btn-outline-primary"
                                    onclick={handleCopyCode}
                                >
                                    {copySuccess ? "Copied!" : "Copy Code"}
                                </button>
                                <small class="text-muted align-self-center">
                                    Length: {exportedCode.length} characters
                                </small>
                            </div>
                        </div>

                        <div class="alert alert-info mb-0">
                            <small
                                ><strong>Export includes:</strong> Card ID,
                                Stats (Speed/Stamina/Power/Guts/Wiz), Aptitudes
                                (Distance/Ground/Style), Skills with levels</small
                            >
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Import Section -->
        <div class="col-lg-6">
            <div class="card shadow-sm h-100">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Import Uma</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="importCode" class="form-label"
                            >Paste Export Code:</label
                        >
                        <textarea
                            class="form-control font-monospace"
                            id="importCode"
                            rows="4"
                            bind:value={importCode}
                            placeholder="Paste the export code here..."
                        ></textarea>
                    </div>

                    <div class="d-flex gap-2 mb-3">
                        <button class="btn btn-success" onclick={handleImport}>
                            Import
                        </button>
                        <button
                            class="btn btn-outline-secondary"
                            onclick={clearImport}
                        >
                            Clear
                        </button>
                    </div>

                    {#if importError}
                        <div class="alert alert-danger">
                            {importError}
                        </div>
                    {/if}

                    {#if importedUma}
                        <div class="alert alert-success">
                            <h6>Import Successful!</h6>
                            <hr />
                            <div class="row g-2">
                                <div class="col-6">
                                    <strong>Card ID:</strong>
                                    {importedUma.card_id}
                                </div>
                                <div class="col-6">
                                    <strong>Speed:</strong>
                                    {importedUma.speed}
                                </div>
                                <div class="col-6">
                                    <strong>Stamina:</strong>
                                    {importedUma.stamina}
                                </div>
                                <div class="col-6">
                                    <strong>Power:</strong>
                                    {importedUma.power}
                                </div>
                                <div class="col-6">
                                    <strong>Guts:</strong>
                                    {importedUma.guts}
                                </div>
                                <div class="col-6">
                                    <strong>Wiz:</strong>
                                    {importedUma.wiz}
                                </div>
                                <div class="col-12">
                                    <strong>Skills:</strong>
                                    {importedUma.skill_array?.length || 0}
                                </div>
                            </div>
                            <hr />
                            <h6>Aptitudes:</h6>
                            <div class="row g-1">
                                <div class="col-6">
                                    <small
                                        >Turf: {importedUma.proper_ground_turf}</small
                                    >
                                </div>
                                <div class="col-6">
                                    <small
                                        >Dirt: {importedUma.proper_ground_dirt}</small
                                    >
                                </div>
                                <div class="col-6">
                                    <small
                                        >Short: {importedUma.proper_distance_short}</small
                                    >
                                </div>
                                <div class="col-6">
                                    <small
                                        >Mile: {importedUma.proper_distance_mile}</small
                                    >
                                </div>
                                <div class="col-6">
                                    <small
                                        >Middle: {importedUma.proper_distance_middle}</small
                                    >
                                </div>
                                <div class="col-6">
                                    <small
                                        >Long: {importedUma.proper_distance_long}</small
                                    >
                                </div>
                            </div>
                            {#if importedUma.skill_array && importedUma.skill_array.length > 0}
                                <hr />
                                <h6>Skills:</h6>
                                <div class="skills-list">
                                    {#each importedUma.skill_array as skill}
                                        <small class="badge bg-secondary me-1"
                                            >{skill.skill_id} (Lv{skill.level})</small
                                        >
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Documentation -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card shadow-sm">
                <div class="card-header">
                    <h5 class="mb-0">About Single Uma Export</h5>
                </div>
                <div class="card-body">
                    <h6>What's Included:</h6>
                    <ul>
                        <li>Card ID</li>
                        <li>Base Stats (Speed, Stamina, Power, Guts, Wisdom)</li>
                        <li>
                            Aptitudes (Distance, Ground Type, Running Style) -
                            values 1-8
                        </li>
                        <li>Skills with full level information (1-8)</li>
                    </ul>

                    <h6 class="mt-3">What's NOT Included:</h6>
                    <ul>
                        <li>
                            Talent level, rank score, factors, parents, support
                            cards
                        </li>
                        <li>
                            These fields are set to default values during import
                        </li>
                    </ul>

                    <h6 class="mt-3">Encoding Format:</h6>
                    <p class="mb-0">
                        The code uses a compact binary format (Version 1)
                        converted to URL-safe Base64. Typical code length is
                        60-130 characters for 8-20 skills. Maximum supported:
                        63 skills (up to 272 characters).
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .font-monospace {
        font-family: "Courier New", Courier, monospace;
        font-size: 0.85rem;
    }

    .skills-list {
        max-height: 200px;
        overflow-y: auto;
    }
</style>
