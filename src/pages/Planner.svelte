<script lang="ts">
    import type { CharaData } from "../types";
    import {
        calculateSingleParentAffinity,
        calculateBaseAffinity,
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

    interface SparkData {
        stat: string;
        level: number;
        isRace?: boolean;
    }

    interface UmaWithSparks extends CharaData {
        blueSpark?: SparkData;
        pinkSpark?: SparkData;
        greenSpark?: SparkData;
        whiteSpark?: SparkData[];
        races?: string[];
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

    let showModal = $state(false);
    let modalPosition = $state("");
    let showSparkProcsModal = $state(false);

    // Affinity calculations
    let p1Affinity = $state(0);
    let p2Affinity = $state(0);
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

    function clearPosition(pos: string) {
        const slot = getSlotByPosition(pos);

        // If clearing a parent from roster (not borrow), also clear its grandparents
        if (pos === "p1" && !slot.isBorrow) {
            setPosition("gp1_1", { uma: null, isBorrow: false });
            setPosition("gp1_2", { uma: null, isBorrow: false });
        } else if (pos === "p2" && !slot.isBorrow) {
            setPosition("gp2_1", { uma: null, isBorrow: false });
            setPosition("gp2_2", { uma: null, isBorrow: false });
        }

        setPosition(pos, { uma: null, isBorrow: false });
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
        gp1_1Affinity = 0;
        gp1_2Affinity = 0;
        gp2_1Affinity = 0;
        gp2_2Affinity = 0;

        if (!p0.uma) return;

        const targetCard = charaCardsData[p0.uma.card_id];
        if (!targetCard) return;
        const targetCharaId = targetCard.chara_id.toString();

        // Calculate parent affinities
        // withMergedRaces ensures user-configured race names (uma.races) are
        // included in win_saddle_id_array so race(p1, GP) comparisons work correctly.
        if (parent1.uma) {
            const result = calculateSingleParentAffinity(
                targetCharaId,
                withMergedRaces(parent1.uma),
            );
            p1Affinity = result.totalAffinity;
        }

        if (parent2.uma) {
            const result = calculateSingleParentAffinity(
                targetCharaId,
                withMergedRaces(parent2.uma),
            );
            p2Affinity = result.totalAffinity;
        }

        // Add aff(p1,p2) and race(p1,p2) to both parents when both are set.
        // Per the affinity formula, these terms appear in both p1_aff and p2_aff.
        // Use uma.races (string names from spark selector) rather than win_saddle_id_array,
        // since borrow umas always have win_saddle_id_array=[] even when races are configured.
        if (parent1.uma && parent2.uma) {
            const p1Card = charaCardsData[parent1.uma.card_id];
            const p2Card = charaCardsData[parent2.uma.card_id];
            if (p1Card && p2Card) {
                const p1CharaId = p1Card.chara_id.toString();
                const p2CharaId = p2Card.chara_id.toString();
                const p1p2BaseAffinity = calculateBaseAffinity([
                    p1CharaId,
                    p2CharaId,
                ]);
                // Compare races by name — works for both roster and borrow umas
                const p1RaceNames = parent1.uma.races || [];
                const p2RaceNames = parent2.uma.races || [];
                const p1RaceSet = new Set(p1RaceNames);
                const p1p2RaceAffinity = p2RaceNames.filter((r) =>
                    p1RaceSet.has(r),
                ).length;
                p1Affinity += p1p2BaseAffinity + p1p2RaceAffinity;
                p2Affinity += p1p2BaseAffinity + p1p2RaceAffinity;
            }
        }

        // Calculate grandparent affinities
        if (gp1_1.uma) {
            const result = calculateSingleParentAffinity(
                targetCharaId,
                withMergedRaces(gp1_1.uma),
            );
            gp1_1Affinity = result.totalAffinity;
        }

        if (gp1_2.uma) {
            const result = calculateSingleParentAffinity(
                targetCharaId,
                withMergedRaces(gp1_2.uma),
            );
            gp1_2Affinity = result.totalAffinity;
        }

        if (gp2_1.uma) {
            const result = calculateSingleParentAffinity(
                targetCharaId,
                withMergedRaces(gp2_1.uma),
            );
            gp2_1Affinity = result.totalAffinity;
        }

        if (gp2_2.uma) {
            const result = calculateSingleParentAffinity(
                targetCharaId,
                withMergedRaces(gp2_2.uma),
            );
            gp2_2Affinity = result.totalAffinity;
        }
    }
</script>

<div class="container-fluid">
    <!-- Top navigation bar -->
    <nav class="navbar navbar-expand-lg bg-slate mb-3">
        <div class="container-fluid">
            <!-- Left side: Title + Nav links -->
            <div class="d-flex gap-2 align-items-center">
                <span class="navbar-brand mb-0 h1">Planner</span>

                <div class="vr mx-1"></div>

                <a class="nav-link" href="#/">Roster</a>
                <a class="nav-link" href="#/affinity">Affinity</a>
                <a class="nav-link active" href="#/planner">Planner</a>
            </div>

            <!-- Right side: Controls -->
            <div class="ms-auto d-flex align-items-center gap-2"></div>
        </div>
    </nav>

    <div class="container-fluid p-4" style="max-width: 1400px;">
        <div
            class="card shadow-lg border-0 rounded-3"
            style="background-color: var(--bs-body-bg);"
        >
            <!-- Header -->
            <div
                class="card-header text-center py-4 border-0"
                style="background-color: transparent; border-bottom: 2px solid #DA3C57;"
            >
                <h1 class="mb-3" style="color: #DA3C57; font-weight: bold;">
                    Lineage Planner
                </h1>
            </div>

            <!-- Tree Content -->
            <div class="card-body p-4" style="min-height: 600px;">
                <!-- Level 1: Target -->
                <div class="row justify-content-center mb-5">
                    <div class="col-12 col-md-8 col-lg-6 col-xl-4">
                        <h5 class="text-center mb-3 text-muted fw-bold">
                            Target
                        </h5>
                        <PlannerUmaCard
                            uma={p0.uma}
                            label="Target"
                            size="lg"
                            borderColor="#DA3C57"
                            onSelect={() => openModal("p0")}
                            onClear={() => clearPosition("p0")}
                            affinityValue={p1Affinity + p2Affinity}
                            sparkProcs={p0SparkProcs}
                            onOpenSparkProcs={() =>
                                (showSparkProcsModal = true)}
                        />
                    </div>
                </div>

                <!-- Level 2: Parents -->
                <div class="row justify-content-center mb-4">
                    <div class="col-12">
                        <h5 class="text-center mb-3 text-muted fw-bold">
                            Parents
                        </h5>
                        <div class="row g-3 justify-content-center">
                            <div class="col-6 col-lg-3">
                                <PlannerUmaCard
                                    uma={parent1.uma}
                                    label="Parent 1"
                                    size="md"
                                    borderColor="#9b59b6"
                                    onSelect={() => openModal("p1")}
                                    onClear={() => clearPosition("p1")}
                                    affinityValue={p1Affinity}
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
                            <div class="col-6 col-lg-3">
                                <PlannerUmaCard
                                    uma={parent2.uma}
                                    label="Parent 2"
                                    size="md"
                                    borderColor="#f39c12"
                                    onSelect={() => openModal("p2")}
                                    onClear={() => clearPosition("p2")}
                                    affinityValue={p2Affinity}
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
                        </div>
                    </div>
                </div>

                <!-- Level 3: Grandparents -->
                <div class="row justify-content-center mb-4">
                    <div class="col-12">
                        <h5 class="text-center mb-3 text-muted fw-bold">
                            Grandparents
                        </h5>
                        <div class="row g-3">
                            <div class="col-6 col-lg-3">
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
                            </div>
                            <div class="col-6 col-lg-3">
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
                            <div class="col-6 col-lg-3">
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
                            </div>
                            <div class="col-6 col-lg-3">
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
    .bg-slate {
        background-color: #475569 !important;
    }

    .navbar-brand {
        color: white !important;
        font-weight: bold;
    }

    .nav-link {
        color: rgba(255, 255, 255, 0.8) !important;
    }

    .nav-link:hover {
        color: white !important;
    }

    .nav-link.active {
        color: white !important;
        font-weight: bold;
    }

    .vr {
        border-left: 1px solid rgba(255, 255, 255, 0.3);
        height: 1.5rem;
    }
</style>
