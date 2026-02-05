<script lang="ts">
    import type { CharaData } from "../types";
    import Chara from "../components/Chara.svelte";
    import {
        calculateSingleParentAffinity,
        type AffinityResult,
    } from "../affinity";
    import { charaCardsData } from "../data";
    import TerumiCharacterData from "../assets/TerumiCharacterData.json";

    interface Props {
        trainedCharas: CharaData[];
    }
    const { trainedCharas }: Props = $props();

    function goBack() {
        window.location.hash = "";
    }

    // Get all available character names for the selector
    const allCharacters = TerumiCharacterData.value
        .map((card) => ({
            charaId: card.charaId.toString(),
            charaName: card.charaName,
            cardId: card.cardId,
        }))
        // Sort alphabetically and remove duplicates
        .sort((a, b) => a.charaName.localeCompare(b.charaName));

    // Remove duplicates based on charaName
    const uniqueCharacters = allCharacters.filter(
        (char, index, self) =>
            index === self.findIndex((c) => c.charaName === char.charaName),
    );

    let selectedCharaId = $state<string>("");
    let sortedUmas = $state<
        Array<{ uma: CharaData; affinity: AffinityResult }>
    >([]);

    // Default display settings for Chara component
    const display = { stats: true, factors: true };

    // Default filters (required by Chara component but not used for filtering here)
    const filters = {
        blues: { stars: 1 },
        reds: { stars: 1 },
        greens: { stars: 1 },
        whites: {},
    };

    function calculateAffinities() {
        if (!selectedCharaId) {
            sortedUmas = [];
            return;
        }

        const results: Array<{ uma: CharaData; affinity: AffinityResult }> = [];

        // Calculate affinity for each uma as Parent 1 (p2 is placeholder)
        // Filter out the selected target uma - an uma cannot be its own parent
        for (const uma of trainedCharas) {
            // Get the chara_id for this roster uma
            const umaCharaId = charaCardsData[uma.card_id]?.chara_id.toString();

            // Skip if this uma is the same character as the selected target
            if (umaCharaId === selectedCharaId) {
                continue;
            }

            const affinity = calculateSingleParentAffinity(
                selectedCharaId,
                uma,
            );
            results.push({ uma, affinity });
        }

        // Sort by total affinity (descending)
        sortedUmas = results.sort(
            (a, b) => b.affinity.totalAffinity - a.affinity.totalAffinity,
        );

        console.log(
            `[Affinity Page] Evaluated ${sortedUmas.length} umas from roster (filtered out selected character)`,
        );
        console.log(
            `[Affinity Page] Top affinity: ${sortedUmas[0]?.affinity.totalAffinity || 0}`,
        );
        if (sortedUmas.length > 0) {
            console.log(
                `[Affinity Page] Top 3 umas:`,
                sortedUmas.slice(0, 3).map((u) => ({
                    uma: u.uma.card_id,
                    total: u.affinity.totalAffinity,
                    breakdown: u.affinity.breakdown,
                })),
            );
        }
    }

    function onCharaSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedCharaId = target.value;
        calculateAffinities();
    }
</script>

<div class="container-fluid">
    <!-- Top navigation bar -->
    <nav class="navbar navbar-expand-lg bg-slate mb-3">
        <div class="container-fluid">
            <div class="d-flex align-items-center gap-3 w-100">
                <button class="btn btn-slate-light btn-sm" onclick={goBack}>
                    ← Back to Roster
                </button>
                <span class="navbar-brand mb-0 h1">Affinity Calculator</span>

                <div class="ms-auto d-flex align-items-center gap-2">
                    <label for="targetCharaSelect" class="form-label mb-0"
                        >Select Target Uma:</label
                    >
                    <select
                        id="targetCharaSelect"
                        class="form-select form-select-sm"
                        style="width: 250px;"
                        onchange={onCharaSelect}
                    >
                        <option value="">-- Choose an Uma --</option>
                        {#each uniqueCharacters as char (char.charaId)}
                            <option value={char.charaId}
                                >{char.charaName}</option
                            >
                        {/each}
                    </select>
                </div>
            </div>
        </div>
    </nav>

    <!-- Instructions -->
    {#if !selectedCharaId}
        <div class="alert alert-info" role="alert">
            <h5 class="alert-heading">How to use the Affinity Calculator</h5>
            <p>
                Select a target uma from the dropdown above to see how well each
                uma in your roster would pair with that target as breeding
                parents. The roster will be sorted by affinity score (highest
                first).
            </p>
            <hr />
            <p class="mb-0">
                <strong>Affinity</strong> is calculated based on shared relations
                (properties like running style, mare status, etc.) and shared race
                wins between the uma, its parents, and grandparents.
            </p>
        </div>
    {:else}
        <!-- Results count -->
        <div class="mb-3">
            <p class="text-muted">
                Showing {sortedUmas.length} uma(s) as potential Parent 1 sorted by
                affinity with
                <strong
                    >{uniqueCharacters.find(
                        (c) => c.charaId === selectedCharaId,
                    )?.charaName}</strong
                >
            </p>
            <p class="text-muted text-sm">
                <em
                    >Note: Parent 2 affinity is not calculated (Values will be
                    slightly lower than in-game)</em
                >
            </p>
        </div>
    {/if}

    <!-- Display sorted umas in grid -->
    {#if selectedCharaId && sortedUmas.length > 0}
        <div class="row row-cols-1 row-cols-lg-2 g-5 py-4">
            {#each sortedUmas as item (item.uma.chara_seed)}
                <div class="col">
                    <!-- Affinity badges -->
                    <div class="affinity-score-badge">
                        <span class="badge badge-total">
                            Total: {item.affinity.totalAffinity}
                        </span>
                        {#if item.affinity.breakdown.p1 > 0}
                            <span
                                class="badge badge-p1"
                                title="Direct affinity between target and P1"
                            >
                                P1: {item.affinity.breakdown.p1}
                            </span>
                        {/if}
                        {#if item.affinity.breakdown.p1_1 > 0}
                            <span
                                class="badge badge-gp"
                                title="Grandparent 1 contribution: aff(P1,GP1) + race(P1,GP1)"
                            >
                                GP1: {item.affinity.breakdown.p1_1}
                            </span>
                        {/if}
                        {#if item.affinity.breakdown.p1_2 > 0}
                            <span
                                class="badge badge-gp"
                                title="Grandparent 2 contribution: aff(P1,GP2) + race(P1,GP2)"
                            >
                                GP2: {item.affinity.breakdown.p1_2}
                            </span>
                        {/if}
                    </div>

                    <!-- Uma card -->
                    <Chara charaData={item.uma} {display} {filters}></Chara>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .affinity-score-badge {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
        align-items: center;
    }

    .affinity-score-badge .badge {
        font-size: 0.75rem;
        padding: 0.35rem 0.6rem;
    }

    .badge-total {
        background-color: #0d6efd;
        color: #ffffff;
    }

    .badge-p1 {
        background-color: #6c757d;
        color: #ffffff;
    }

    .badge-gp {
        background-color: #0dcaf0;
        color: #000000;
    }

    .text-sm {
        font-size: 0.875rem;
    }

    .bg-slate {
        background-color: #475569 !important;
    }

    .btn-slate-light {
        background-color: #94a3b8;
        border-color: #94a3b8;
        color: #fff;
    }

    .btn-slate-light:hover {
        background-color: #64748b;
        border-color: #64748b;
    }
</style>
