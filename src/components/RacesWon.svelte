<script lang="ts">
    // This whole component is vibe-coded
    import racesJson from "../assets/races.json";

    interface Race {
        group_id: number;
        race_id: number;
        race_name: string;
        saddle_id: number;
    }

    interface Props {
        title: string;
        winSaddleIds?: number[];
    }

    const { title, winSaddleIds = [] }: Props = $props();

    const races = racesJson as Race[];

    // Map saddle_id → race
    const raceBySaddleId = $derived.by(() => {
        const map = new Map<number, Race>();
        for (const race of races) {
            map.set(race.saddle_id, race);
        }
        return map;
    });

    const wonRaces = $derived(
        winSaddleIds
            .map((id) => raceBySaddleId.get(id))
            .filter((r): r is Race => !!r),
    );

    function raceThumbnailUrl(raceId: number): string {
        return `/race_thumbnail/thum_race_rt_000_${raceId}_00.webp`;
    }
</script>

<div class="mb-2">
    <small class="text-muted">{title}</small>

    <div class="races-container mt-1">
        {#each wonRaces as race}
            <div
                class="race-thumb"
                title={race.race_name}
            >
                <img
                    src={raceThumbnailUrl(race.race_id)}
                    alt={race.race_name}
                    loading="lazy"
                />
            </div>
        {/each}
    </div>
</div>

<style>
    .races-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .race-thumb {
        width: 64px;
        height: 32px;
        overflow: hidden;
        background-color: #1f2937;
        border: 1px solid #334155;
        cursor: default;
    }

    .race-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
</style>
