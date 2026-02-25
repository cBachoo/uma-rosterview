<script lang="ts">
    import type { CharaData, SparkData, UmaWithSparks } from "../types";
    import {
        calculateBaseAffinity,
        calculateSharedRaces,
    } from "../utils/affinity";
    import { charaCardsData } from "../data";
    import { racesArray } from "../utils/races";
    import PlannerUmaCard from "../components/planner/PlannerUmaCard.svelte";
    import UmaSelectionModal from "../components/planner/UmaSelectionModal.svelte";
    import SparkProcsModal from "../components/planner/SparkProcsModal.svelte";
    import { extractSparksFromCharaData } from "../utils/sparkExtractor";
    import { calculateSparkProcs } from "../utils/inspiration";

    interface Props {
        trainedCharas?: CharaData[];
        onHome?: () => void;
    }

    interface TreeSlot {
        uma: UmaWithSparks | null;
        isBorrow: boolean;
        autoPopulated?: boolean;
    }

    const { trainedCharas = [], onHome }: Props = $props();

    // Tree state - all positions independently editable
    let p0: TreeSlot = $state({ uma: null, isBorrow: false });
    let parent1: TreeSlot = $state({ uma: null, isBorrow: false });
    let parent2: TreeSlot = $state({ uma: null, isBorrow: false });
    let gp1_1: TreeSlot = $state({ uma: null, isBorrow: false });
    let gp1_2: TreeSlot = $state({ uma: null, isBorrow: false });
    let gp2_1: TreeSlot = $state({ uma: null, isBorrow: false });
    let gp2_2: TreeSlot = $state({ uma: null, isBorrow: false });
    // Great-grandparents (Level 4) - pink spark only, for GP aptitude calculations
    let ggp1_1_1: TreeSlot = $state({ uma: null, isBorrow: false });
    let ggp1_1_2: TreeSlot = $state({ uma: null, isBorrow: false });
    let ggp1_2_1: TreeSlot = $state({ uma: null, isBorrow: false });
    let ggp1_2_2: TreeSlot = $state({ uma: null, isBorrow: false });
    let ggp2_1_1: TreeSlot = $state({ uma: null, isBorrow: false });
    let ggp2_1_2: TreeSlot = $state({ uma: null, isBorrow: false });
    let ggp2_2_1: TreeSlot = $state({ uma: null, isBorrow: false });
    let ggp2_2_2: TreeSlot = $state({ uma: null, isBorrow: false });

    let showModal = $state(false);
    let modalPosition = $state("");
    let showSparkProcsModal = $state(false);

    // Affinity calculations
    // p1/p2: direct 2-way aff(p0, parent) only — GP contributions are tracked separately
    // p1p2: cross-parent aff(p1, p2) — no races (later game mechanic)
    // gpX_X: 3-way aff(p0, parent, gp) + race(parent, gp)
    let p1Affinity = $state(0);
    let p2Affinity = $state(0);
    let p1p2Affinity = $state(0);
    let gp1_1Affinity = $state(0);
    let gp1_2Affinity = $state(0);
    let gp2_1Affinity = $state(0);
    let gp2_2Affinity = $state(0);

    // Spark proc calculations for p0
    let p0SparkProcs = $derived.by(() => {
        if (!p0.uma) return {};

        const p1Data = parent1.uma
            ? { uma: parent1.uma, affinity: p1Affinity }
            : null;
        const p2Data = parent2.uma
            ? { uma: parent2.uma, affinity: p2Affinity }
            : null;

        return calculateSparkProcs(
            p1Data,
            p2Data,
            gp1_1.uma,
            gp1_2.uma,
            gp2_1.uma,
            gp2_2.uma,
            gp1_1Affinity,
            gp1_2Affinity,
            gp2_1Affinity,
            gp2_2Affinity,
        );
    });

    function openModal(position: string) {
        modalPosition = position;
        showModal = true;
    }

    const isTargetSelection = $derived(modalPosition === "p0");

    function setPosition(pos: string, value: TreeSlot) {
        switch (pos) {
            case "p0":
                p0 = value;
                break;
            case "p1":
                parent1 = value;
                break;
            case "p2":
                parent2 = value;
                break;
            case "gp1_1":
                gp1_1 = value;
                break;
            case "gp1_2":
                gp1_2 = value;
                break;
            case "gp2_1":
                gp2_1 = value;
                break;
            case "gp2_2":
                gp2_2 = value;
                break;
            case "ggp1_1_1":
                ggp1_1_1 = value;
                break;
            case "ggp1_1_2":
                ggp1_1_2 = value;
                break;
            case "ggp1_2_1":
                ggp1_2_1 = value;
                break;
            case "ggp1_2_2":
                ggp1_2_2 = value;
                break;
            case "ggp2_1_1":
                ggp2_1_1 = value;
                break;
            case "ggp2_1_2":
                ggp2_1_2 = value;
                break;
            case "ggp2_2_1":
                ggp2_2_1 = value;
                break;
            case "ggp2_2_2":
                ggp2_2_2 = value;
                break;
        }
        recalculateAffinity();
    }

    function getParentContext() {
        // Return context for affinity sorting in modal
        if (
            modalPosition === "p1" ||
            modalPosition === "gp1_1" ||
            modalPosition === "gp1_2"
        ) {
            return {
                targetId: p0.uma?.card_id,
                siblingGrandparents: [gp1_1.uma, gp1_2.uma],
            };
        } else if (
            modalPosition === "p2" ||
            modalPosition === "gp2_1" ||
            modalPosition === "gp2_2"
        ) {
            return {
                targetId: p0.uma?.card_id,
                siblingGrandparents: [gp2_1.uma, gp2_2.uma],
            };
        }
        return { targetId: undefined, siblingGrandparents: [] };
    }

    function selectParentFromRoster(uma: CharaData) {
        const sparks = extractSparksFromCharaData(uma);
        const umaWithSparks: UmaWithSparks = { ...uma, ...sparks };
        setPosition(modalPosition, { uma: umaWithSparks, isBorrow: false });

        // Auto-populate grandparents from parent's succession data
        if (
            uma.succession_chara_array &&
            uma.succession_chara_array.length >= 2
        ) {
            // Determine which grandparent slots to fill based on which parent was selected
            if (modalPosition === "p1") {
                // Parent 1 selected - fill GP1.1 and GP1.2
                const gp1Data = uma.succession_chara_array[0];
                const gp2Data = uma.succession_chara_array[1];

                if (gp1Data) {
                    const gp1Sparks = extractSparksFromCharaData(gp1Data);
                    setPosition("gp1_1", {
                        uma: { ...gp1Data, ...gp1Sparks },
                        isBorrow: false,
                        autoPopulated: true,
                    });
                }
                if (gp2Data) {
                    const gp2Sparks = extractSparksFromCharaData(gp2Data);
                    setPosition("gp1_2", {
                        uma: { ...gp2Data, ...gp2Sparks },
                        isBorrow: false,
                        autoPopulated: true,
                    });
                }
            } else if (modalPosition === "p2") {
                // Parent 2 selected - fill GP2.1 and GP2.2
                const gp1Data = uma.succession_chara_array[0];
                const gp2Data = uma.succession_chara_array[1];

                if (gp1Data) {
                    const gp1Sparks = extractSparksFromCharaData(gp1Data);
                    setPosition("gp2_1", {
                        uma: { ...gp1Data, ...gp1Sparks },
                        isBorrow: false,
                        autoPopulated: true,
                    });
                }
                if (gp2Data) {
                    const gp2Sparks = extractSparksFromCharaData(gp2Data);
                    setPosition("gp2_2", {
                        uma: { ...gp2Data, ...gp2Sparks },
                        isBorrow: false,
                        autoPopulated: true,
                    });
                }
            }
        }

        showModal = false;
    }

    function selectBorrowUma(uma: CharaData) {
        const umaWithSparks: UmaWithSparks = { ...uma };
        setPosition(modalPosition, { uma: umaWithSparks, isBorrow: true });
        showModal = false;
    }

    const empty = () => ({ uma: null, isBorrow: false });

    function clearPosition(pos: string) {
        // Cascade clear — always clear descendants when a position is cleared
        if (pos === "p1") {
            setPosition("gp1_1", empty());
            setPosition("gp1_2", empty());
            setPosition("ggp1_1_1", empty());
            setPosition("ggp1_1_2", empty());
            setPosition("ggp1_2_1", empty());
            setPosition("ggp1_2_2", empty());
        } else if (pos === "p2") {
            setPosition("gp2_1", empty());
            setPosition("gp2_2", empty());
            setPosition("ggp2_1_1", empty());
            setPosition("ggp2_1_2", empty());
            setPosition("ggp2_2_1", empty());
            setPosition("ggp2_2_2", empty());
        } else if (pos === "gp1_1") {
            setPosition("ggp1_1_1", empty());
            setPosition("ggp1_1_2", empty());
        } else if (pos === "gp1_2") {
            setPosition("ggp1_2_1", empty());
            setPosition("ggp1_2_2", empty());
        } else if (pos === "gp2_1") {
            setPosition("ggp2_1_1", empty());
            setPosition("ggp2_1_2", empty());
        } else if (pos === "gp2_2") {
            setPosition("ggp2_2_1", empty());
            setPosition("ggp2_2_2", empty());
        }

        setPosition(pos, empty());
    }

    // Spark change handlers
    function updateSparkData(pos: string, updates: Partial<UmaWithSparks>) {
        const slot = getSlotByPosition(pos);
        if (!slot.uma) return;

        const updatedUma = { ...slot.uma, ...updates };
        setPosition(pos, { ...slot, uma: updatedUma });
    }

    function getSlotByPosition(pos: string): TreeSlot {
        switch (pos) {
            case "p0":
                return p0;
            case "p1":
                return parent1;
            case "p2":
                return parent2;
            case "gp1_1":
                return gp1_1;
            case "gp1_2":
                return gp1_2;
            case "gp2_1":
                return gp2_1;
            case "gp2_2":
                return gp2_2;
            case "ggp1_1_1":
                return ggp1_1_1;
            case "ggp1_1_2":
                return ggp1_1_2;
            case "ggp1_2_1":
                return ggp1_2_1;
            case "ggp1_2_2":
                return ggp1_2_2;
            case "ggp2_1_1":
                return ggp2_1_1;
            case "ggp2_1_2":
                return ggp2_1_2;
            case "ggp2_2_1":
                return ggp2_2_1;
            case "ggp2_2_2":
                return ggp2_2_2;
            default:
                return { uma: null, isBorrow: false };
        }
    }

    function handleBlueSparkChange(pos: string) {
        return (spark: { stat: string; level: number }) => {
            updateSparkData(pos, { blueSpark: spark });
        };
    }

    function handlePinkSparkChange(pos: string) {
        return (spark: { stat: string; level: number }) => {
            updateSparkData(pos, { pinkSpark: spark });
        };
    }

    function handleGreenSparkChange(pos: string) {
        return (spark: { stat: string; level: number }) => {
            updateSparkData(pos, { greenSpark: spark });
        };
    }

    function handleWhiteSparkChange(pos: string) {
        return (sparks: { stat: string; level: number }[]) => {
            updateSparkData(pos, { whiteSpark: sparks });
        };
    }

    function handleRacesChange(pos: string) {
        return (races: string[]) => {
            updateSparkData(pos, { races });
        };
    }

    /**
     * Returns a copy of the uma with user-configured races (string names) merged
     * into win_saddle_id_array as saddle IDs. This is necessary because:
     * - Roster umas: win_saddle_id_array comes from game data; user may add extra races via spark selector
     * - Borrow umas: win_saddle_id_array comes from base character data; user-added races are in uma.races
     * calculateSingleParentAffinity uses win_saddle_id_array for race(p1, GP) comparisons.
     */
    function withMergedRaces(uma: UmaWithSparks): UmaWithSparks {
        if (!uma.races || uma.races.length === 0) return uma;
        const mergedIds = new Set(uma.win_saddle_id_array || []);
        for (const raceName of uma.races) {
            const race = racesArray.find((r) => r.race_name === raceName);
            if (race) mergedIds.add(race.saddle_id);
        }
        return { ...uma, win_saddle_id_array: Array.from(mergedIds) };
    }

    function recalculateAffinity() {
        // Reset all
        p1Affinity = 0;
        p2Affinity = 0;
        p1p2Affinity = 0;
        gp1_1Affinity = 0;
        gp1_2Affinity = 0;
        gp2_1Affinity = 0;
        gp2_2Affinity = 0;

        if (!p0.uma) return;

        const targetCard = charaCardsData[p0.uma.card_id];
        if (!targetCard) return;
        const targetCharaId = targetCard.chara_id.toString();

        const p1Card = parent1.uma ? charaCardsData[parent1.uma.card_id] : null;
        const p2Card = parent2.uma ? charaCardsData[parent2.uma.card_id] : null;
        const p1CharaId = p1Card?.chara_id.toString() ?? "";
        const p2CharaId = p2Card?.chara_id.toString() ?? "";

        // Parent direct: aff(p0, p1) and aff(p0, p2) — 2-way only, no GP contributions
        if (parent1.uma && p1Card) {
            p1Affinity = calculateBaseAffinity([targetCharaId, p1CharaId]);
        }
        if (parent2.uma && p2Card) {
            p2Affinity = calculateBaseAffinity([targetCharaId, p2CharaId]);
        }

        // Cross-parent: aff(p1, p2) — base only, no races (later game update)
        if (parent1.uma && parent2.uma && p1Card && p2Card) {
            p1p2Affinity = calculateBaseAffinity([p1CharaId, p2CharaId]);
        }

        // GP affinities: aff(p0, parent, gp) 3-way + race(parent, gp)
        // withMergedRaces ensures user-configured race names feed into win_saddle_id_array
        function calcGpAffinity(
            parentCharaId: string,
            parentUma: UmaWithSparks,
            gp: typeof gp1_1,
        ): number {
            if (!gp.uma || !parentCharaId) return 0;
            const gpCard = charaCardsData[gp.uma.card_id];
            if (!gpCard) return 0;
            const gpCharaId = gpCard.chara_id.toString();
            const base = calculateBaseAffinity([
                targetCharaId,
                parentCharaId,
                gpCharaId,
            ]);
            const races = calculateSharedRaces(
                withMergedRaces(parentUma).win_saddle_id_array || [],
                withMergedRaces(gp.uma).win_saddle_id_array || [],
            );
            return base + races;
        }

        if (parent1.uma && p1Card) {
            gp1_1Affinity = calcGpAffinity(p1CharaId, parent1.uma, gp1_1);
            gp1_2Affinity = calcGpAffinity(p1CharaId, parent1.uma, gp1_2);
        }
        if (parent2.uma && p2Card) {
            gp2_1Affinity = calcGpAffinity(p2CharaId, parent2.uma, gp2_1);
            gp2_2Affinity = calcGpAffinity(p2CharaId, parent2.uma, gp2_2);
        }
    }
</script>

<div class="container-fluid px-0">
    <!-- Top navigation bar -->
    <nav class="planner-topbar">
        <div class="topbar-content">
            <div class="nav-pills-container">
                <a class="nav-pill" href="#/">Roster</a>
                <a class="nav-pill" href="#/affinity">Affinity</a>
                <a class="nav-pill active" href="#/planner">Planner</a>
            </div>
        </div>
    </nav>

    <div class="planner-container">
        <div
            class="card shadow-lg border-0 rounded-3 planner-card"
            style="background-color: var(--bs-body-bg);"
        >
            <!-- Header -->
            <div
                class="card-header text-center py-2 py-md-4 border-0"
                style="background-color: transparent; border-bottom: 2px solid #DA3C57;"
            >
                <h1 class="mb-1 mb-md-3" style="color: #DA3C57; font-weight: bold;">
                    Lineage Planner
                </h1>
            </div>

            <!-- Tree Content -->
            <div class="card-body tree-content">
                <!-- Level 1: Target -->
                <div class="row gx-0 justify-content-center level-section target-section">
                    <div class="col-12 col-md-8 col-lg-6 col-xl-4 target-col">
                        <h5 class="text-center mb-3 text-muted fw-bold level-heading">
                            Target
                        </h5>
                        <PlannerUmaCard
                            uma={p0.uma}
                            label="Target"
                            size="lg"
                            borderColor="#DA3C57"
                            onSelect={() => openModal("p0")}
                            onClear={() => clearPosition("p0")}
                            affinityValue={p1Affinity +
                                p2Affinity +
                                p1p2Affinity +
                                gp1_1Affinity +
                                gp1_2Affinity +
                                gp2_1Affinity +
                                gp2_2Affinity}
                            ancestorPinkSparks={[
                                parent1.uma?.pinkSpark,
                                parent2.uma?.pinkSpark,
                                gp1_1.uma?.pinkSpark,
                                gp1_2.uma?.pinkSpark,
                                gp2_1.uma?.pinkSpark,
                                gp2_2.uma?.pinkSpark,
                            ]}
                            sparkProcs={p0SparkProcs}
                            onOpenSparkProcs={() =>
                                (showSparkProcsModal = true)}
                        />
                    </div>
                </div>

                <!-- Lineage columns with per-column headings -->
                <div class="row gx-0 lineage-row">
                    <!-- Left lineage (Parent 1 / Purple) -->
                    <div class="col-6 pe-1">
                        <div class="lineage-column">
                            <!-- Parent 1 -->
                            <div class="lineage-section">
                                <div class="lineage-header" style="border-color: #9b59b6;">
                                    <span>Parent 1</span>
                                </div>
                                <PlannerUmaCard
                                    uma={parent1.uma}
                                    label="Parent 1"
                                    size="md"
                                    borderColor="#9b59b6"
                                    onSelect={() => openModal("p1")}
                                    onClear={() => clearPosition("p1")}
                                    affinityValue={p1Affinity}
                                    ancestorPinkSparks={[
                                        gp1_1.uma?.pinkSpark,
                                        gp1_2.uma?.pinkSpark,
                                    ]}
                                    onBlueSparkChange={handleBlueSparkChange(
                                        "p1",
                                    )}
                                    onPinkSparkChange={handlePinkSparkChange(
                                        "p1",
                                    )}
                                    onGreenSparkChange={handleGreenSparkChange(
                                        "p1",
                                    )}
                                    onWhiteSparkChange={handleWhiteSparkChange(
                                        "p1",
                                    )}
                                    onRacesChange={handleRacesChange("p1")}
                                />
                            </div>
                            <!-- Grandparents 1.1 and 1.2 -->
                            <div class="lineage-section">
                                <div class="lineage-header lineage-header-sm" style="border-color: #9b59b6;">
                                    <span>Grandparents</span>
                                </div>
                                <div class="d-flex flex-column gap-1">
                                    <PlannerUmaCard
                                        uma={gp1_1.uma}
                                        label="GP1.1"
                                        size="sm"
                                        borderColor="#9b59b6"
                                        onSelect={() => openModal("gp1_1")}
                                        onClear={gp1_1.autoPopulated
                                            ? undefined
                                            : () => clearPosition("gp1_1")}
                                        affinityValue={gp1_1Affinity}
                                        ancestorPinkSparks={[
                                            ggp1_1_1.uma?.pinkSpark,
                                            ggp1_1_2.uma?.pinkSpark,
                                        ]}
                                        onBlueSparkChange={handleBlueSparkChange(
                                            "gp1_1",
                                        )}
                                        onPinkSparkChange={handlePinkSparkChange(
                                            "gp1_1",
                                        )}
                                        onGreenSparkChange={handleGreenSparkChange(
                                            "gp1_1",
                                        )}
                                        onWhiteSparkChange={handleWhiteSparkChange(
                                            "gp1_1",
                                        )}
                                        onRacesChange={handleRacesChange("gp1_1")}
                                    />
                                    <PlannerUmaCard
                                        uma={gp1_2.uma}
                                        label="GP1.2"
                                        size="sm"
                                        borderColor="#9b59b6"
                                        onSelect={() => openModal("gp1_2")}
                                        onClear={gp1_2.autoPopulated
                                            ? undefined
                                            : () => clearPosition("gp1_2")}
                                        affinityValue={gp1_2Affinity}
                                        ancestorPinkSparks={[
                                            ggp1_2_1.uma?.pinkSpark,
                                            ggp1_2_2.uma?.pinkSpark,
                                        ]}
                                        onBlueSparkChange={handleBlueSparkChange(
                                            "gp1_2",
                                        )}
                                        onPinkSparkChange={handlePinkSparkChange(
                                            "gp1_2",
                                        )}
                                        onGreenSparkChange={handleGreenSparkChange(
                                            "gp1_2",
                                        )}
                                        onWhiteSparkChange={handleWhiteSparkChange(
                                            "gp1_2",
                                        )}
                                        onRacesChange={handleRacesChange("gp1_2")}
                                    />
                                </div>
                            </div>
                            <!-- Great-Grandparents (purple lineage) -->
                            <div class="lineage-section">
                                <div class="lineage-header lineage-header-xs" style="border-color: #7c3aed;">
                                    <span>Great-Grandparents</span>
                                </div>
                                <div class="row g-1">
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp1_1_1.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#7c3aed"
                                            onSelect={() =>
                                                openModal("ggp1_1_1")}
                                            onClear={ggp1_1_1.uma
                                                ? () =>
                                                      clearPosition("ggp1_1_1")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp1_1_1",
                                            )}
                                        />
                                    </div>
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp1_1_2.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#7c3aed"
                                            onSelect={() =>
                                                openModal("ggp1_1_2")}
                                            onClear={ggp1_1_2.uma
                                                ? () =>
                                                      clearPosition("ggp1_1_2")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp1_1_2",
                                            )}
                                        />
                                    </div>
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp1_2_1.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#7c3aed"
                                            onSelect={() =>
                                                openModal("ggp1_2_1")}
                                            onClear={ggp1_2_1.uma
                                                ? () =>
                                                      clearPosition("ggp1_2_1")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp1_2_1",
                                            )}
                                        />
                                    </div>
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp1_2_2.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#7c3aed"
                                            onSelect={() =>
                                                openModal("ggp1_2_2")}
                                            onClear={ggp1_2_2.uma
                                                ? () =>
                                                      clearPosition("ggp1_2_2")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp1_2_2",
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right lineage (Parent 2 / Orange) -->
                    <div class="col-6 ps-1">
                        <div class="lineage-column">
                            <!-- Parent 2 -->
                            <div class="lineage-section">
                                <div class="lineage-header" style="border-color: #f39c12;">
                                    <span>Parent 2</span>
                                </div>
                                <PlannerUmaCard
                                    uma={parent2.uma}
                                    label="Parent 2"
                                    size="md"
                                    borderColor="#f39c12"
                                    onSelect={() => openModal("p2")}
                                    onClear={() => clearPosition("p2")}
                                    affinityValue={p2Affinity}
                                    ancestorPinkSparks={[
                                        gp2_1.uma?.pinkSpark,
                                        gp2_2.uma?.pinkSpark,
                                    ]}
                                    onBlueSparkChange={handleBlueSparkChange(
                                        "p2",
                                    )}
                                    onPinkSparkChange={handlePinkSparkChange(
                                        "p2",
                                    )}
                                    onGreenSparkChange={handleGreenSparkChange(
                                        "p2",
                                    )}
                                    onWhiteSparkChange={handleWhiteSparkChange(
                                        "p2",
                                    )}
                                    onRacesChange={handleRacesChange("p2")}
                                />
                            </div>
                            <!-- Grandparents 2.1 and 2.2 -->
                            <div class="lineage-section">
                                <div class="lineage-header lineage-header-sm" style="border-color: #f39c12;">
                                    <span>Grandparents</span>
                                </div>
                                <div class="d-flex flex-column gap-1">
                                    <PlannerUmaCard
                                        uma={gp2_1.uma}
                                        label="GP2.1"
                                        size="sm"
                                        borderColor="#f39c12"
                                        onSelect={() => openModal("gp2_1")}
                                        onClear={gp2_1.autoPopulated
                                            ? undefined
                                            : () => clearPosition("gp2_1")}
                                        affinityValue={gp2_1Affinity}
                                        ancestorPinkSparks={[
                                            ggp2_1_1.uma?.pinkSpark,
                                            ggp2_1_2.uma?.pinkSpark,
                                        ]}
                                        onBlueSparkChange={handleBlueSparkChange(
                                            "gp2_1",
                                        )}
                                        onPinkSparkChange={handlePinkSparkChange(
                                            "gp2_1",
                                        )}
                                        onGreenSparkChange={handleGreenSparkChange(
                                            "gp2_1",
                                        )}
                                        onWhiteSparkChange={handleWhiteSparkChange(
                                            "gp2_1",
                                        )}
                                        onRacesChange={handleRacesChange("gp2_1")}
                                    />
                                    <PlannerUmaCard
                                        uma={gp2_2.uma}
                                        label="GP2.2"
                                        size="sm"
                                        borderColor="#f39c12"
                                        onSelect={() => openModal("gp2_2")}
                                        onClear={gp2_2.autoPopulated
                                            ? undefined
                                            : () => clearPosition("gp2_2")}
                                        affinityValue={gp2_2Affinity}
                                        ancestorPinkSparks={[
                                            ggp2_2_1.uma?.pinkSpark,
                                            ggp2_2_2.uma?.pinkSpark,
                                        ]}
                                        onBlueSparkChange={handleBlueSparkChange(
                                            "gp2_2",
                                        )}
                                        onPinkSparkChange={handlePinkSparkChange(
                                            "gp2_2",
                                        )}
                                        onGreenSparkChange={handleGreenSparkChange(
                                            "gp2_2",
                                        )}
                                        onWhiteSparkChange={handleWhiteSparkChange(
                                            "gp2_2",
                                        )}
                                        onRacesChange={handleRacesChange("gp2_2")}
                                    />
                                </div>
                            </div>
                            <!-- Great-Grandparents (orange lineage) -->
                            <div class="lineage-section">
                                <div class="lineage-header lineage-header-xs" style="border-color: #d97706;">
                                    <span>Great-Grandparents</span>
                                </div>
                                <div class="row g-1">
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp2_1_1.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#d97706"
                                            onSelect={() =>
                                                openModal("ggp2_1_1")}
                                            onClear={ggp2_1_1.uma
                                                ? () =>
                                                      clearPosition("ggp2_1_1")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp2_1_1",
                                            )}
                                        />
                                    </div>
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp2_1_2.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#d97706"
                                            onSelect={() =>
                                                openModal("ggp2_1_2")}
                                            onClear={ggp2_1_2.uma
                                                ? () =>
                                                      clearPosition("ggp2_1_2")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp2_1_2",
                                            )}
                                        />
                                    </div>
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp2_2_1.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#d97706"
                                            onSelect={() =>
                                                openModal("ggp2_2_1")}
                                            onClear={ggp2_2_1.uma
                                                ? () =>
                                                      clearPosition("ggp2_2_1")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp2_2_1",
                                            )}
                                        />
                                    </div>
                                    <div class="col-6">
                                        <PlannerUmaCard
                                            uma={ggp2_2_2.uma}
                                            label="GGP"
                                            size="xs"
                                            borderColor="#d97706"
                                            onSelect={() =>
                                                openModal("ggp2_2_2")}
                                            onClear={ggp2_2_2.uma
                                                ? () =>
                                                      clearPosition("ggp2_2_2")
                                                : undefined}
                                            onPinkSparkChange={handlePinkSparkChange(
                                                "ggp2_2_2",
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>

{#if showModal}
    <UmaSelectionModal
        {trainedCharas}
        onClose={() => (showModal = false)}
        onSelectRoster={selectParentFromRoster}
        onSelectBorrow={selectBorrowUma}
        {isTargetSelection}
        parentContext={getParentContext()}
    />
{/if}

{#if showSparkProcsModal && p0SparkProcs}
    <SparkProcsModal
        sparkProcs={p0SparkProcs}
        onClose={() => (showSparkProcsModal = false)}
    />
{/if}

<style>
    .planner-topbar {
        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
    }

    .topbar-content {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .nav-pills-container {
        display: flex;
        gap: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.25rem;
        border-radius: 0.5rem;
    }

    .nav-pill {
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.15s ease;
    }

    .nav-pill:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
    }

    .nav-pill.active {
        color: white;
        background: #DA3C57;
    }

    @media (max-width: 575.98px) {
        .planner-topbar {
            padding: 0.5rem 0.75rem;
            margin-bottom: 0.75rem;
            margin-left: -0.75rem;
            margin-right: -0.75rem;
        }

        .nav-pill {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
        }
    }

    /* Desktop defaults */
    .planner-container {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .tree-content {
        padding: 1.5rem;
        min-height: 600px;
    }

    .target-section {
        margin-bottom: 2.5rem !important;
    }

    /* Lineage structure */
    .lineage-row {
        margin-top: 0.5rem;
    }

    .lineage-column {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .lineage-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .lineage-header {
        font-size: 0.85rem;
        font-weight: 600;
        color: #6c757d;
        padding: 0.25rem 0;
        background: transparent;
    }

    .lineage-header-sm {
        font-size: 0.75rem;
        padding: 0.2rem 0;
    }

    .lineage-header-xs {
        font-size: 0.65rem;
        padding: 0.15rem 0;
    }

    /* Mobile optimizations */
    @media (max-width: 767.98px) {
        .planner-container {
            padding: 0 !important;
        }

        .tree-content {
            padding: 0 !important;
            min-height: auto !important;
        }

        .planner-card {
            border-radius: 0 !important;
            margin: 0 !important;
        }

        .planner-card .card-body {
            padding: 0.25rem !important;
        }

        .planner-card .card-header {
            padding: 0.5rem !important;
        }

        .planner-card .card-header h1 {
            font-size: 1.1rem !important;
            margin-bottom: 0.25rem !important;
        }

        .level-section {
            margin-bottom: 0.75rem !important;
        }

        .target-section {
            margin-bottom: 1.25rem !important;
        }

        .target-col {
            padding: 0 0.5rem;
        }

        /* Lineage mobile styles */
        .lineage-column {
            gap: 0.5rem;
        }

        .lineage-section {
            gap: 0.25rem;
        }

        .lineage-header {
            font-size: 0.65rem;
            padding: 0.15rem 0;
        }

        .lineage-header-sm {
            font-size: 0.55rem;
            padding: 0.1rem 0;
        }

        .lineage-header-xs {
            font-size: 0.5rem;
            padding: 0.08rem 0;
        }

        .level-heading {
            font-size: 0.8rem !important;
            margin-bottom: 0.35rem !important;
        }
    }

    /* Extra small screens */
    @media (max-width: 575.98px) {
        .planner-container {
            padding: 0 !important;
        }

        .tree-content {
            padding: 0 !important;
        }

        .planner-card .card-body {
            padding: 0.15rem !important;
        }

        .planner-card .card-header {
            padding: 0.35rem !important;
        }

        .planner-card .card-header h1 {
            font-size: 1rem !important;
        }

        .level-section {
            margin-bottom: 0.5rem !important;
        }

        .target-section {
            margin-bottom: 1rem !important;
        }

        .target-col {
            padding: 0 0.35rem;
        }

        .level-heading {
            font-size: 0.75rem !important;
            margin-bottom: 0.25rem !important;
        }

        .lineage-header {
            font-size: 0.55rem;
            padding: 0.1rem 0;
        }

        .lineage-header-sm {
            font-size: 0.5rem;
        }

        .lineage-header-xs {
            font-size: 0.45rem;
        }

        .lineage-column {
            gap: 0.35rem;
        }

        .lineage-section {
            gap: 0.15rem;
        }
    }
</style>
