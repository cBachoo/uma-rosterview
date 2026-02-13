<script lang="ts">
    import { racesBySaddleId, getRaceThumbnailUrl } from "../races";
    import type { Race } from "../races";

    interface Props {
        title: string;
        winSaddleIds?: number[];
    }

    const { title, winSaddleIds = [] }: Props = $props();

    const wonRaces = $derived(
        winSaddleIds
            .map((id) => racesBySaddleId.get(id))
            .filter((r): r is Race => !!r),
    );
</script>

<div class="mb-2">
    <small class="text-muted">{title}</small>

    <div class="races-container mt-1">
        {#each wonRaces as race}
            <div class="race-thumb" title={race.race_name}>
                <img
                    src={getRaceThumbnailUrl(race.race_id)}
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
