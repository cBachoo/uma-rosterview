<script lang="ts">
    import type { CharaData } from "../types";
    import { normalizeRosterData } from "../utils/normalize";

    let {
        uploaddata,
        onImport,
    }: { uploaddata: (data: CharaData[]) => void; onImport?: () => void } =
        $props();

    let files: FileList | null = $state(null);
    $effect(() => {
        if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = normalizeRosterData(JSON.parse(content));
                    uploaddata(data);
                } catch (error) {
                    console.error("Failed to parse JSON file:", error);
                }
            };

            reader.readAsText(file);
        }
    });
</script>

<div class="row justify-content-center py-4">
    <div class="col-lg-8 col-md-10 col-12">
        <!-- Upload Section -->
        <div class="text-center mb-5">
            <h4 class="mb-3">Upload Your Roster</h4>
            <p class="text-muted mb-4">
                Select your exported <code>data.json</code> file to view your trained
                characters
            </p>
            <div class="upload-zone p-3 rounded-3 mb-4">
                <input
                    bind:files
                    type="file"
                    class="form-control form-control-lg upload-input"
                    accept=".json"
                />
            </div>

            {#if onImport}
                <div class="divider-text">
                    <span class="text-muted px-3">or</span>
                </div>
                <button class="btn btn-slate-light mt-3" onclick={onImport}>
                    Import from Shared Link
                </button>
            {/if}

            <div class="mt-4 p-3 bg-slate rounded">
                <p class="mb-2 text-muted">
                    Want to plan lineages without uploading?
                </p>
                <button
                    class="btn btn-success"
                    onclick={() => (window.location.hash = "/planner")}
                >
                    Open Lineage Planner
                </button>
            </div>
        </div>

        <!-- Instructions Section -->
        <div class="card shadow-sm">
            <div class="card-header bg-transparent">
                <h5 class="mb-0">How to Export Your Data</h5>
            </div>
            <div class="card-body p-0">
                <!-- Step 1 -->
                <div class="step-item d-flex p-4 border-bottom">
                    <div class="step-number me-4">
                        <span class="badge bg-slate rounded-circle fs-5">1</span
                        >
                    </div>
                    <div class="step-content flex-grow-1">
                        <h6 class="mb-2">Download the Extractor Tool</h6>
                        <p class="text-muted mb-3">
                            Get UmaExtractor from GitHub to export your game
                            data.
                        </p>
                        <div class="btn-group" role="group">
                            <a
                                class="btn btn-slate"
                                href="https://github.com/xancia/UmaExtractor/releases"
                                target="_blank"
                                rel="noopener"
                            >
                                Download
                            </a>
                            <a
                                class="btn btn-slate-outline"
                                href="https://github.com/xancia/UmaExtractor"
                                target="_blank"
                                rel="noopener"
                            >
                                View on GitHub
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Step 2 -->
                <div class="step-item d-flex p-4 border-bottom">
                    <div class="step-number me-4">
                        <span class="badge bg-slate rounded-circle fs-5">2</span
                        >
                    </div>
                    <div class="step-content flex-grow-1">
                        <h6 class="mb-2">Navigate to Veteran List</h6>
                        <p class="text-muted mb-3">
                            In the game, go to Enhance, then Veteran List, then
                            click into List.
                        </p>
                        <div
                            class="guide-images d-flex align-items-center justify-content-center gap-3 flex-wrap"
                        >
                            <div class="guide-step text-center">
                                <img
                                    class="img-fluid rounded shadow-sm"
                                    src={`${import.meta.env.BASE_URL}guide/guide-01.png`}
                                    alt="Step 1: Enhance"
                                    style="height: 72px;"
                                />
                                <small class="d-block mt-1 text-muted"
                                    >Enhance</small
                                >
                            </div>
                            <span class="text-muted fs-4">&rarr;</span>
                            <div class="guide-step text-center">
                                <img
                                    class="img-fluid rounded shadow-sm"
                                    src={`${import.meta.env.BASE_URL}guide/guide-02.png`}
                                    alt="Step 2: Veteran List"
                                    style="height: 72px;"
                                />
                                <small class="d-block mt-1 text-muted"
                                    >Veteran List</small
                                >
                            </div>
                            <span class="text-muted fs-4">&rarr;</span>
                            <div class="guide-step text-center">
                                <img
                                    class="img-fluid rounded shadow-sm"
                                    src={`${import.meta.env.BASE_URL}guide/guide-03.png`}
                                    alt="Step 3: List"
                                    style="height: 72px;"
                                />
                                <small class="d-block mt-1 text-muted"
                                    >List</small
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 3 -->
                <div class="step-item d-flex p-4 border-bottom">
                    <div class="step-number me-4">
                        <span class="badge bg-slate rounded-circle fs-5">3</span
                        >
                    </div>
                    <div class="step-content flex-grow-1">
                        <h6 class="mb-2">Run the Extractor</h6>
                        <p class="text-muted mb-0">
                            Execute <code class="bg-light px-2 py-1 rounded"
                                >umaextractor.exe</code
                            >
                            while viewing the Veteran List. It will generate a
                            <code class="bg-light px-2 py-1 rounded"
                                >data.json</code
                            > file.
                        </p>
                    </div>
                </div>

                <!-- Step 4 -->
                <div class="step-item d-flex p-4">
                    <div class="step-number me-4">
                        <span class="badge bg-slate rounded-circle fs-5">4</span
                        >
                    </div>
                    <div class="step-content flex-grow-1">
                        <h6 class="mb-2">Upload Your Data</h6>
                        <p class="text-muted mb-0">
                            Use the upload area above to load your exported file
                            and view your roster.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Footer -->
<footer class="text-center py-4 mt-5 border-top">
    <div class="container">
        <p class="text-muted mb-0">
            Original creator: <a
                href="https://github.com/rockisch"
                target="_blank"
                rel="noopener">Rockisch</a
            >
            · Contributors:
            <a href="https://github.com/cBachoo" target="_blank" rel="noopener"
                >Bachoo</a
            >,
            <a href="https://github.com/xancia" target="_blank" rel="noopener"
                >Terumi</a
            >
        </p>
    </div>
</footer>

<style>
    /* Slate color palette */
    .bg-slate {
        background-color: #475569 !important;
        color: white;
    }

    .btn-slate {
        background-color: #475569;
        border-color: #475569;
        color: white;
    }

    .btn-slate:hover {
        background-color: #334155;
        border-color: #334155;
        color: white;
    }

    .btn-slate-outline {
        background-color: transparent;
        border: 1px solid #475569;
        color: #475569;
    }

    .btn-slate-outline:hover {
        background-color: #475569;
        border-color: #475569;
        color: white;
    }

    .btn-slate-light {
        background-color: #94a3b8;
        border-color: #94a3b8;
        color: white;
    }

    .btn-slate-light:hover {
        background-color: #64748b;
        border-color: #64748b;
        color: white;
    }

    .upload-zone {
        background-color: #f1f5f9;
    }

    .upload-input {
        background-color: #cbd5e1;
        border: 1px solid #94a3b8;
        color: #334155;
    }

    .upload-input:hover,
    .upload-input:focus {
        background-color: #e2e8f0;
        border-color: #64748b;
    }

    .upload-input::file-selector-button {
        background-color: #64748b;
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        margin-right: 1rem;
    }

    .upload-input::file-selector-button:hover {
        background-color: #475569;
    }

    .border-dashed {
        border-style: dashed !important;
    }

    .divider-text {
        display: flex;
        align-items: center;
        text-align: center;
    }

    .divider-text::before,
    .divider-text::after {
        content: "";
        flex: 1;
        border-bottom: 1px solid #dee2e6;
    }

    .step-number .badge {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .step-item:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }

    .guide-images img {
        transition: transform 0.2s ease;
    }

    .guide-images img:hover {
        transform: scale(1.05);
    }
</style>
