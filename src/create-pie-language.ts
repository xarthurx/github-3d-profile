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

    const outerRadius = radius - margin;
    const innerRadius = radius / 2;

    const arc = d3
        .arc<d3.PieArcDatum<type.LangInfo>>()
        .outerRadius(outerRadius)
        .innerRadius(innerRadius);

    // Breathing parameters (all effects synchronized)
    const breathDur = 6; // seconds per cycle
    const breathSteps = 40; // keyframes for smooth motion
    const breathBegin = '3s'; // start after intro

    // pie chart
    const pieGroup = group
        .append('g')
        .attr('transform', `translate(${radius}, ${radius})`);

    // Glow pulse filter: animated Gaussian blur shadow
    if (isAnimate) {
        const defs = svg.append('defs');
        const filter = defs
            .append('filter')
            .attr('id', 'pie-glow')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');

        const blur = filter
            .append('feGaussianBlur')
            .attr('in', 'SourceAlpha')
            .attr('stdDeviation', '0')
            .attr('result', 'blur');

        // Animate blur radius: 0 → 5 → 0
        blur.append('animate')
            .attr('attributeName', 'stdDeviation')
            .attr('values', Array.from(
                { length: breathSteps + 1 },
                (_, step) => {
                    const t = step / breathSteps;
                    return (2.5 + 2.5 * Math.sin(2 * Math.PI * t)).toFixed(2);
                },
            ).join(';'))
            .attr('dur', `${breathDur}s`)
            .attr('begin', breathBegin)
            .attr('repeatCount', 'indefinite');

        filter
            .append('feOffset')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('result', 'offsetBlur');

        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'offsetBlur');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');

        pieGroup.attr('filter', 'url(#pie-glow)');
    }

    // Scale breathing on the whole pie group (±1%, synced to 6s)
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
            .attr('values', '1;1.01;1;0.99;1')
            .attr('dur', `${breathDur}s`)
            .attr('begin', breathBegin)
            .attr('repeatCount', 'indefinite')
            .attr('additive', 'sum');
    }

    // Unified opacity breathing values (all slices together, ease-in-out)
    const breathOpacityValues = Array.from(
        { length: breathSteps + 1 },
        (_, step) => {
            const t = step / breathSteps;
            // Cosine ease-in-out: 0.85 → 1.0 → 0.85
            const v = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t));
            return v.toFixed(3);
        },
    ).join(';');

    // Radial breathing: generate arc paths with varying outer radius
    const radiusVariation = 6; // pixels of expansion
    const breathArcPaths = (d: d3.PieArcDatum<type.LangInfo>) => {
        const arcGen = d3
            .arc<d3.PieArcDatum<type.LangInfo>>()
            .innerRadius(innerRadius);
        return Array.from(
            { length: breathSteps + 1 },
            (_, step) => {
                const t = step / breathSteps;
                const r =
                    outerRadius +
                    radiusVariation * Math.sin(2 * Math.PI * t);
                arcGen.outerRadius(r);
                return arcGen(d);
            },
        ).join(';');
    };

    const paths = pieGroup
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('path')
        .attr('d', arc)
        .style('fill', (d) => d.data.color)
        .attr('class', 'stroke-bg')
        .attr('stroke-width', '2px');
    paths
        .append('title')
        .text((d) => `${d.data.language} ${d.data.contributions}`);

    if (isAnimate) {
        // Intro: sequential fade-in (0→1 over 3s)
        paths
            .append('animate')
            .attr('attributeName', 'fill-opacity')
            .attr('values', (d, i) => animateOpacity(i))
            .attr('dur', '3s')
            .attr('repeatCount', '1');

        // Continuous: unified opacity breathing on each path
        paths.each(function (d) {
            const el = d3.select(this);

            el.append('animate')
                .attr('attributeName', 'fill-opacity')
                .attr('values', breathOpacityValues)
                .attr('dur', `${breathDur}s`)
                .attr('begin', breathBegin)
                .attr('repeatCount', 'indefinite');

            // Radial breathing: animate the d attribute with varying outer radius
            el.append('animate')
                .attr('attributeName', 'd')
                .attr('values', breathArcPaths(d))
                .attr('dur', `${breathDur}s`)
                .attr('begin', breathBegin)
                .attr('repeatCount', 'indefinite');
        });
    }
};
