<script lang="ts">
    import { factorsData, charaCardsData } from "../../data";

    interface SparkData {
        stat: string;
        level: number;
    }

    type SparkType = "blue" | "pink" | "green" | "race";

    interface Props {
        type: SparkType;
        currentValue?: SparkData | string[];
        onClose: () => void;
        onChange: (value: any) => void;
        races?: string[];
        cardId?: number;
    }

    const {
        type,
        currentValue,
        onClose,
        onChange,
        races = [],
        cardId,
    }: Props = $props();

    // Get unique skill name for this character
    const uniqueSkillName = $derived.by(() => {
        if (type !== "green" || !cardId) return "";

        const card = charaCardsData[cardId];
        if (!card) return "";

        // Find the type 3 factor for this character
        const uniqueFactor = Object.values(factorsData).find(
            (factor) =>
                factor.type === 3 &&
                factor.name.includes(card.name.split(" ")[1]), // Match character name
        );

        return uniqueFactor?.name || `${card.name}'s Unique`;
    });

    // Configuration per type
    const config = {
        blue: {
            title: "Blue Spark (Stats)",
            buttonClass: "btn-primary",
            outlineClass: "btn-outline-primary",
            options: ["Speed", "Stamina", "Power", "Guts", "Wits"],
        },
        pink: {
            title: "Pink Spark (Aptitudes)",
            buttonClass: "btn-pink",
            outlineClass: "btn-outline-pink",
            options: [
                "Turf",
                "Dirt",
                "Sprint",
                "Mile",
                "Medium",
                "Long",
                "Front Runner",
                "Pace Chaser",
                "Late Surger",
                "End Closer",
            ],
        },
        green: {
            title: "Unique Spark",
            buttonClass: "btn-success",
            outlineClass: "btn-outline-success",
            options: [],
        },
        race: {
            title: "G1 Races Won",
            buttonClass: "btn-warning",
            outlineClass: "btn-outline-warning",
            options: races,
        },
    };

    const currentConfig = config[type];
    const starLevels = [1, 2, 3];
    const isMultiSelect = type === "race";
    const isGreenOnly = type === "green";

    // State
    let selectedStat = $state(
        isMultiSelect ? "" : (currentValue as SparkData)?.stat || "",
    );
    let selectedLevel = $state((currentValue as SparkData)?.level || 0);
    let selectedRaces = $state<Set<string>>(
        new Set(isMultiSelect ? (currentValue as string[]) : []),
    );
    let raceSearch = $state("");

    function toggleRace(raceName: string) {
        const newSet = new Set(selectedRaces);
        if (newSet.has(raceName)) {
            newSet.delete(raceName);
        } else {
            newSet.add(raceName);
        }
        selectedRaces = newSet;
    }

    function handleApply() {
        if (isMultiSelect) {
            onChange(Array.from(selectedRaces));
        } else if (isGreenOnly) {
            if (selectedLevel > 0) {
                onChange({
                    stat: uniqueSkillName || `p${selectedLevel} unique`,
                    level: selectedLevel,
                });
            }
        } else {
            if (selectedStat && selectedLevel > 0) {
                onChange({ stat: selectedStat, level: selectedLevel });
            }
        }
        onClose();
    }

    function handleClear() {
        if (isMultiSelect) {
            onChange([]);
        } else {
            onChange({ stat: "", level: 0 });
        }
        onClose();
    }

    const canApply = $derived(
        isMultiSelect
            ? true
            : isGreenOnly
              ? selectedLevel > 0
              : selectedStat && selectedLevel > 0,
    );
</script>

<div class="modal-backdrop" onclick={onClose}></div>
<div class="modal-dialog-sm">
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h6 class="modal-title">
                {currentConfig.title}
                {#if isMultiSelect}({selectedRaces.size} selected){/if}
            </h6>
            <button type="button" class="btn-close" onclick={onClose}></button>
        </div>

        <div class="modal-body p-2">
            {#if isGreenOnly && uniqueSkillName}
                <!-- Display unique skill name -->
                <div class="mb-2">
                    <small
                        class="text-muted text-uppercase fw-bold d-block mb-1"
                        >Unique Skill</small
                    >
                    <div class="alert alert-success mb-2 py-2">
                        <small>{uniqueSkillName}</small>
                    </div>
                </div>
            {/if}

            {#if !isGreenOnly}
                <!-- Stat/Race Selection -->
                <div class="mb-2">
                    <small
                        class="text-muted text-uppercase fw-bold d-block mb-1"
                    >
                        {isMultiSelect ? "Races" : "Stat"}
                    </small>
                    {#if isMultiSelect}
                        <input
                            type="text"
                            class="form-control form-control-sm mb-2"
                            placeholder="Search races..."
                            bind:value={raceSearch}
                        />
                    {/if}
                    <div class="d-grid gap-1">
                        {#each currentConfig.options.filter((o) => !raceSearch || o
                                    .toLowerCase()
                                    .includes(raceSearch.toLowerCase())) as option}
                            <button
                                type="button"
                                class="btn btn-sm text-start {isMultiSelect
                                    ? selectedRaces.has(option)
                                        ? currentConfig.buttonClass
                                        : currentConfig.outlineClass
                                    : selectedStat === option
                                      ? currentConfig.buttonClass
                                      : currentConfig.outlineClass}"
                                onclick={() =>
                                    isMultiSelect
                                        ? toggleRace(option)
                                        : (selectedStat = option)}
                            >
                                <small>{option}</small>
                            </button>
                        {/each}
                    </div>
                </div>

                {#if !isMultiSelect}
                    <hr class="my-2" />
                {/if}
            {/if}

            <!-- Level Selection (not for races) -->
            {#if !isMultiSelect}
                <div class="mb-2">
                    <small
                        class="text-muted text-uppercase fw-bold d-block mb-1"
                        >Level</small
                    >
                    <div class="d-flex gap-1">
                        {#each starLevels as level}
                            <button
                                class="btn btn-sm flex-fill {selectedLevel ===
                                level
                                    ? 'btn-warning'
                                    : 'btn-outline-warning'}"
                                onclick={() => (selectedLevel = level)}
                            >
                                <small>{"★".repeat(level)}</small>
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <div class="modal-footer p-2">
            <button class="btn btn-sm btn-secondary" onclick={handleClear}>
                <small>{isMultiSelect ? "Clear All" : "Clear"}</small>
            </button>
            <button
                class="btn btn-sm btn-primary"
                onclick={handleApply}
                disabled={!canApply}
            >
                <small>Apply</small>
            </button>
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
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1040;
    }

    .modal-dialog-sm {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1050;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-content {
        background: var(--bs-body-bg);
        border: 1px solid var(--bs-border-color);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
    }

    .modal-header {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-title {
        margin: 0;
        font-size: 0.875rem;
    }

    .modal-body {
        padding: 0.75rem;
        max-height: 60vh;
        overflow-y: auto;
    }

    .modal-footer {
        padding: 0.5rem 0.75rem;
        border-top: 1px solid var(--bs-border-color);
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .btn-close {
        background: transparent;
        border: none;
        font-size: 1.25rem;
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

    .btn-pink {
        background-color: #c6417b;
        border-color: #c6417b;
        color: white;
    }
    .btn-pink:hover {
        background-color: #a8325f;
        border-color: #a8325f;
        color: white;
    }
    .btn-outline-pink {
        color: #c6417b;
        border-color: #c6417b;
        background: transparent;
    }
    .btn-outline-pink:hover {
        background: #c6417b;
        color: white;
    }
</style>
