import * as d3 from 'd3';
import * as type from './type';

const OTHER_NAME = 'other';
const OTHER_COLOR = '#444444';

export const createPieLanguage = (
    svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    userInfo: type.UserInfo,
    x: number,
    y: number,
    width: number,
    height: number,
    settings: type.PieLangSettings,
    isForcedAnimation: boolean,
): void => {
    if (userInfo.totalContributions === 0) {
        return;
    }

    const languages = userInfo.contributesLanguage.slice(0, 5);
    const sumContrib = languages
        .map((lang) => lang.contributions)
        .reduce((a, b) => a + b, 0);
    const otherContributions = userInfo.totalCommitContributions - sumContrib;
    if (0 < otherContributions) {
        languages.push({
            language: OTHER_NAME,
            color: OTHER_COLOR,
            contributions: otherContributions,
        });
    }

    // Override language colors with theme pieColors if provided
    if (settings.pieColors && settings.pieColors.length > 0) {
        languages.forEach((lang, i) => {
            if (i < settings.pieColors!.length) {
                lang.color = settings.pieColors![i];
            }
        });
    }

    const isAnimate = settings.growingAnimation || isForcedAnimation;
    const animeSteps = 5;
    const animateOpacity = (num: number) =>
        Array<string>(languages.length + animeSteps)
            .fill('')
            .map((d, i) => (i < num ? 0 : Math.min((i - num) / animeSteps, 1)))
            .join(';');

    const radius = height / 2;
    const margin = radius / 10;

    const row = 8;
    const offset = (row - languages.length) / 2 + 0.5;
    const fontSize = height / row / 1.5;

    const pie = d3
        .pie<type.LangInfo>()
        .value((d) => d.contributions)
        .sortValues(null);
    const pieData = pie(languages);

    const group = svg.append('g').attr('transform', `translate(${x}, ${y})`);

    const groupLabel = group
        .append('g')
        .attr('transform', `translate(${radius * 2.1}, ${0})`);

    // markers for label
    const markers = groupLabel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => (d.index + offset) * (height / row) - fontSize / 2)
        .attr('width', fontSize)
        .attr('height', fontSize)
        .attr('fill', (d) => d.data.color)
        .attr('class', 'stroke-bg')
        .attr('stroke-width', '1px');
    if (isAnimate) {
        markers
            .append('animate')
            .attr('attributeName', 'fill-opacity')
            .attr('values', (d, i) => animateOpacity(i))
            .attr('dur', '3s')
            .attr('repeatCount', '1');
    }

    // labels
    const labels = groupLabel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('text')
        .attr('dominant-baseline', 'middle')
        .text((d) => d.data.language)
        .attr('x', fontSize * 1.2)
        .attr('y', (d) => (d.index + offset) * (height / row))
        .attr('class', 'fill-fg')
        .attr('font-size', `${fontSize}px`);
    if (isAnimate) {
        labels
            .append('animate')
            .attr('attributeName', 'fill-opacity')
            .attr('values', (d, i) => animateOpacity(i))
            .attr('dur', '3s')
            .attr('repeatCount', '1');
    }

    const arc = d3
        .arc<d3.PieArcDatum<type.LangInfo>>()
        .outerRadius(radius - margin)
        .innerRadius(radius / 2);

    // pie chart
    const pieGroup = group
        .append('g')
        .attr('transform', `translate(${radius}, ${radius})`);

    // Subtle scale breathing on the whole pie group
    if (isAnimate) {
        pieGroup
            .append('animateTransform')
            .attr('attributeName', 'transform')
            .attr('type', 'translate')
            .attr('values', `${radius} ${radius}`)
            .attr('dur', '0.1s')
            .attr('repeatCount', '1')
            .attr('fill', 'freeze');
        pieGroup
            .append('animateTransform')
            .attr('attributeName', 'transform')
            .attr('type', 'scale')
            .attr('values', '1;1.015;1;0.985;1')
            .attr('dur', '5s')
            .attr('begin', '3s')
            .attr('repeatCount', 'indefinite')
            .attr('additive', 'sum');
    }

    // Per-slice circular breathing: opacity sweeps around the pie
    const breathCycleDur = 4; // seconds for full cycle
    const breathMin = 0.5;
    const breathMax = 1.0;
    const breathSteps = 20;
    const circularBreathValues = (sliceIndex: number, total: number) => {
        const phase = sliceIndex / total;
        return Array.from({ length: breathSteps + 1 }, (_, step) => {
            const t = step / breathSteps;
            // Sine wave with phase offset per slice
            const v = breathMin + (breathMax - breathMin) *
                (0.5 + 0.5 * Math.sin(2 * Math.PI * (t - phase)));
            return v.toFixed(3);
        }).join(';');
    };

    // Wrap each slice in a <g> so we can attach multiple animations
    const sliceGroups = pieGroup
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('g');

    const paths = sliceGroups
        .append('path')
        .attr('d', arc)
        .style('fill', (d) => d.data.color)
        .attr('class', 'stroke-bg')
        .attr('stroke-width', '2px');
    paths
        .append('title')
        .text((d) => `${d.data.language} ${d.data.contributions}`);
    if (isAnimate) {
        // Intro: sequential fade-in (0→1 over 3s) on the path
        paths
            .append('animate')
            .attr('attributeName', 'fill-opacity')
            .attr('values', (d, i) => animateOpacity(i))
            .attr('dur', '3s')
            .attr('repeatCount', '1');
        // Continuous: circular breathing opacity on the wrapper <g>
        sliceGroups
            .append('animate')
            .attr('attributeName', 'opacity')
            .attr('values', (d, i) =>
                circularBreathValues(i, languages.length),
            )
            .attr('dur', `${breathCycleDur}s`)
            .attr('begin', '3s')
            .attr('repeatCount', 'indefinite');
    }
};
