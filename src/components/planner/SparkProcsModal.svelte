<script lang="ts">
    interface SparkProcResult {
        stat: string;
        chanceAtLeastOnce: number;
        type: string;
    }

    interface Props {
        sparkProcs: Record<string, SparkProcResult>;
        onClose: () => void;
    }

    const { sparkProcs, onClose }: Props = $props();

    let searchTerm = $state("");
    let sortBy = $state<"name" | "type" | "chance">("chance");
    let sortDirection = $state<"asc" | "desc">("desc");

    const getSparkTypeColor = (type: string): string => {
        switch (type) {
            case "blueSpark":
                return "text-primary";
            case "pinkSpark":
                return "text-pink";
            case "greenSpark":
                return "text-success";
            case "whiteSpark":
                return "text-secondary";
            default:
                return "text-muted";
        }
    };

    const getSparkTypeLabel = (type: string): string => {
        switch (type) {
            case "blueSpark":
                return "Stat";
            case "pinkSpark":
                return "Aptitude";
            case "greenSpark":
                return "Unique";
            case "whiteSpark":
                return "Skill";
            default:
                return type;
        }
    };

    const filteredAndSorted = $derived.by(() => {
        let entries = Object.entries(sparkProcs);

        // Filter by search term
        if (searchTerm) {
            entries = entries.filter(([stat]) =>
                stat.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        // Sort
        entries.sort(([statA, procA], [statB, procB]) => {
            let comparison = 0;
            if (sortBy === "name") {
                comparison = statA.localeCompare(statB);
            } else if (sortBy === "type") {
                comparison = procA.type.localeCompare(procB.type);
            } else if (sortBy === "chance") {
                comparison = procA.chanceAtLeastOnce - procB.chanceAtLeastOnce;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });

        return entries;
    });

    function toggleSort(column: "name" | "type" | "chance") {
        if (sortBy === column) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortBy = column;
            sortDirection = "desc";
        }
    }
</script>

<div class="modal-backdrop" onclick={onClose}></div>
<div class="modal-dialog-centered">
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h5 class="modal-title">Inspiration Chances (per career)</h5>
            <button type="button" class="btn-close" onclick={onClose}></button>
        </div>

        <div class="modal-body">
            <!-- Search -->
            <div class="mb-3">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Search by name..."
                    bind:value={searchTerm}
                />
            </div>

            <!-- Sort Headers -->
            <div
                class="d-flex gap-2 mb-2 pb-2 border-bottom text-uppercase fw-bold small"
            >
                <button
                    class="flex-fill btn btn-sm btn-link text-start p-0 text-decoration-none"
                    onclick={() => toggleSort("name")}
                >
                    Name {#if sortBy === "name"}{sortDirection === "asc"
                            ? "▲"
                            : "▼"}{/if}
                </button>
                <button
                    class="btn btn-sm btn-link p-0 text-decoration-none"
                    style="width: 80px;"
                    onclick={() => toggleSort("type")}
                >
                    Type {#if sortBy === "type"}{sortDirection === "asc"
                            ? "▲"
                            : "▼"}{/if}
                </button>
                <button
                    class="btn btn-sm btn-link p-0 text-decoration-none text-end"
                    style="width: 80px;"
                    onclick={() => toggleSort("chance")}
                >
                    Chance {#if sortBy === "chance"}{sortDirection === "asc"
                            ? "▲"
                            : "▼"}{/if}
                </button>
            </div>

            <!-- Results -->
            <div class="spark-list">
                {#each filteredAndSorted as [stat, proc]}
                    <div
                        class="d-flex gap-2 align-items-center mb-2 pb-2 border-bottom"
                    >
                        <div class="flex-fill text-truncate">
                            <small>{stat}</small>
                        </div>
                        <div
                            class={getSparkTypeColor(proc.type)}
                            style="width: 80px;"
                        >
                            <small>{getSparkTypeLabel(proc.type)}</small>
                        </div>
                        <div class="text-end fw-bold" style="width: 80px;">
                            <small>{proc.chanceAtLeastOnce.toFixed(1)}%</small>
                        </div>
                    </div>
                {/each}

                {#if filteredAndSorted.length === 0}
                    <div class="text-center text-muted py-4">
                        <small>No spark procs found</small>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1040;
    }

    .modal-dialog-centered {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1050;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
    }

    .modal-content {
        background: var(--bs-dark);
        border: 1px solid var(--bs-border-color);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        max-height: 90vh;
    }

    .modal-header {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-body {
        padding: 1rem;
        overflow-y: auto;
        flex: 1;
    }

    .spark-list {
        max-height: 60vh;
        overflow-y: auto;
    }

    .btn-close {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        font-weight: bold;
        line-height: 1;
        color: var(--bs-body-color);
        opacity: 0.5;
        cursor: pointer;
    }

    .btn-close:hover {
        opacity: 1;
    }

    .btn-close:before {
        content: "×";
    }

    .text-pink {
        color: #c6417b;
    }
</style>
