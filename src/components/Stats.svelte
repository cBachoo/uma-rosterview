<script lang="ts">
    interface Props {
        speed: number;
        stamina: number;
        power: number;
        guts: number;
        wiz: number;
    }
    const { speed, stamina, power, guts, wiz }: Props = $props();
</script>

<ul class="list-group list-group-horizontal flex-fill">
    <li class="list-group-item">
        <img src={`/status/speed.png`} alt="Speed" />
        {speed}
    </li>
    <li class="list-group-item">
        <img src={`/status/stamina.png`} alt="Stamina" />
        {stamina}
    </li>
    <li class="list-group-item">
        <img src={`/status/power.png`} alt="Power" />
        {power}
    </li>
    <li class="list-group-item">
        <img src={`/status/guts.png`} alt="Guts" />
        {guts}
    </li>
    <li class="list-group-item">
        <span><img src={`/status/wiz.png`} alt="Wit" /> {wiz}</span>
    </li>
</ul>

<style>
    img {
        height: 20px;
    }
</style>
