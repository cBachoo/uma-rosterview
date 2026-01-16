<script lang="ts">
    import type { CharaData } from "../types";
    import Chara from "../components/Chara.svelte";
    import Filter from "../components/Filter.svelte";
    import { stateStorage } from "../localstorage.svelte";
    import { charaCardsData, factorsData, skillsData } from "../data";

    interface Props {
        trainedCharas: CharaData[];
    }
    const { trainedCharas }: Props = $props();

    const display = stateStorage("display", { stats: true, factors: true });
    function onDisplayClick(event: Event, key: string) {
        event.preventDefault();
        display.value[key] = !display.value[key];
    }

    let filters = $state({
        blues: {
            speed: false,
            stamina: false,
            power: false,
            guts: false,
            wit: false,
            stars: 1,
        },
        reds: {
            turf: false,
            dirt: false,
            frontRunner: false,
            paceChaser: false,
            lateSurger: false,
            endCloser: false,
            sprint: false,
            mile: false,
            medium: false,
            long: false,
            stars: 1,
        },
        greens: { stars: 1 },
        whites: { stars: 1 } as {
            [key: string]: boolean | number;
            stars: number;
        },
    });

    const availableWhites = $derived(() => {
        const factorIds = new Set<number>();
        trainedCharas.forEach((chara) => {
            chara.factor_id_array.forEach((id) => factorIds.add(id));
            chara.succession_chara_array.forEach((s) =>
                s.factor_id_array.forEach((id) => factorIds.add(id)),
            );
        });
        const whiteNames = new Set<string>();
        factorIds.forEach((id) => {
            const f = factorsData[id];
            if (f?.type === 4) whiteNames.add(f.name);
        });
        return Array.from(whiteNames).sort();
    });

    const trainedCharasFiltered = $derived(
        trainedCharas
            .filter((chara) => {
                let isDisplayed = true;

                // Factor filters
                const nameMap = {
                    frontRunner: "Front Runner",
                    paceChaser: "Pace Chaser",
                    lateSurger: "Late Surger",
                    endCloser: "End Closer",
                };

                const allFactors = chara.factor_id_array;

                // Blues
                const selectedBlues = Object.entries(filters.blues)
                    .filter(([k, v]) => k !== "stars" && v)
                    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
                if (selectedBlues.length > 0) {
                    const hasBlue = allFactors.some((id) => {
                        const f = factorsData[id];
                        return (
                            f?.type === 1 &&
                            selectedBlues.includes(f.name) &&
                            f.rarity >= filters.blues.stars
                        );
                    });
                    isDisplayed = isDisplayed && hasBlue;
                }

                // Reds
                const selectedReds = Object.entries(filters.reds)
                    .filter(([k, v]) => k !== "stars" && v)
                    .map(
                        ([k]) =>
                            (nameMap as Record<string, string>)[k] ||
                            k.charAt(0).toUpperCase() + k.slice(1),
                    );
                if (selectedReds.length > 0) {
                    const hasRed = allFactors.some((id) => {
                        const f = factorsData[id];
                        return (
                            f?.type === 2 &&
                            selectedReds.includes(f.name) &&
                            f.rarity >= filters.reds.stars
                        );
                    });
                    isDisplayed = isDisplayed && hasRed;
                }

                // Greens
                if (filters.greens.stars > 0) {
                    const hasGreen = allFactors.some((id) => {
                        const f = factorsData[id];
                        return (
                            f?.type === 3 && f.rarity >= filters.greens.stars
                        );
                    });
                    isDisplayed = isDisplayed && hasGreen;
                }

                // Whites
                const selectedWhites = Object.entries(filters.whites)
                    .filter(([k, v]) => k !== "stars" && v)
                    .map(([k]) => k);
                if (selectedWhites.length > 0) {
                    const hasAllWhites = selectedWhites.every((skill) =>
                        allFactors.some((id) => {
                            const f = factorsData[id];
                            return (
                                f?.type === 4 &&
                                f.name === skill &&
                                f.rarity >= filters.whites.stars
                            );
                        }),
                    );
                    isDisplayed = isDisplayed && hasAllWhites;
                }

                return isDisplayed;
            })
            .sort((a, b) => b.create_time.localeCompare(a.create_time)),
    );
</script>

<div>
    <nav class="navbar sticky-top navbar-expand bg-body-tertiary gap-2">
        <div class="container-fluid"></div>
        <div class="dropdown">
            <button
                class="btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
            >
                Display
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button
                        class="dropdown-item"
                        onclickcapture={(e) => onDisplayClick(e, "stats")}
                    >
                        <div class="form-check">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                id="displayStats"
                                bind:checked={display.value.stats}
                            />
                            <label class="form-check-label" for="displayStats"
                                >Stats</label
                            >
                        </div>
                    </button>
                </li>
                <li>
                    <button
                        class="dropdown-item"
                        onclickcapture={(e) => onDisplayClick(e, "factors")}
                    >
                        <div class="form-check">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                id="displaySparks"
                                bind:checked={display.value.factors}
                            />
                            <label class="form-check-label" for="displaySparks"
                                >Sparks</label
                            >
                        </div>
                    </button>
                </li>
            </ul>
        </div>

        <Filter {filters} {availableWhites} />
    </nav>

    <div class="row row-cols-1 row-cols-lg-2 g-5 py-4">
        {#each trainedCharasFiltered as chara (chara.chara_seed)}
            <div class="col">
                <Chara charaData={chara} display={display.value} {filters}></Chara>
            </div>
        {/each}
    </div>
</div>

<style>
    .skill-icon {
        object-fit: cover;
        border: 1px solid #dee2e6;
    }

    .skill-icon:hover {
        transform: scale(1.1);
        transition: transform 0.2s;
    }
</style>
