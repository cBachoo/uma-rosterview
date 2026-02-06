<script lang="ts">
    import type { CharaData } from "../types";

    interface Props {
        charaData: CharaData;
    }
    const { charaData }: Props = $props();
    const sranks = $derived.by(() => {
        const results = [];
        if (charaData.proper_ground_dirt >= 8) results.push("Dirt");
        if (charaData.proper_ground_turf >= 8) results.push("Turf");
        if (charaData.proper_distance_short >= 8) results.push("Sprint");
        if (charaData.proper_distance_mile >= 8) results.push("Mile");
        if (charaData.proper_distance_middle >= 8) results.push("Medium");
        if (charaData.proper_distance_long >= 8) results.push("Long");
        if (charaData.proper_running_style_nige >= 8) results.push("Front");
        if (charaData.proper_running_style_oikomi >= 8) results.push("End");
        if (charaData.proper_running_style_sashi >= 8) results.push("Late");
        if (charaData.proper_running_style_senko >= 8) results.push("Pace");
        return results.join(", ");
    });
</script>

{#if sranks}
    <ul class="list-group list-group-horizontal flex-fill mt-2">
        <li class="list-group-item">
            <img src={`/rank/utx_ico_statusrank_14.png`} alt="S Rank" />
            {sranks}
        </li>
    </ul>
{/if}

<style>
    img {
        height: 20px;
    }
</style>
