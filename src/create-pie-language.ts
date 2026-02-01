import * as d3 from 'd3';
import type * as type from './type';
import { OTHER_COLOR } from './utils';

const OTHER_NAME = 'other';

/** Intro animation */
const INTRO_DURATION = '3s';
const INTRO_FADE_STEPS = 5;

/** Pie chart label layout */
const LABEL_ROW_COUNT = 8;

/** Breathing animation (continuous, after intro) */
const BREATH_DURATION_SECONDS = 6;
const BREATH_KEYFRAMES = 40;
const BREATH_BEGIN = INTRO_DURATION;
const BREATH_RADIUS_VARIATION = 6;
const BREATH_OPACITY_MIN = 0.85;
const BREATH_OPACITY_RANGE = 0.15;
const BREATH_SCALE_RANGE = 0.01;

/** Glow filter blur range */
const GLOW_BLUR_MIN = 2.5;
const GLOW_BLUR_RANGE = 2.5;

export const createPieLanguage = (
    svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    userInfo: type.UserInfo,
    x: number,
    y: number,
    _width: number,
    height: number,
    settings: type.PieLangSettings,
    isForcedAnimation: boolean,
): void => {
    if (userInfo.totalContributions === 0) {
        return;
    }

    const languages = userInfo.contributesLanguage.slice(0, 5);
    const sumContrib = languages.map((lang) => lang.contributions).reduce((a, b) => a + b, 0);
    const otherContributions = userInfo.totalCommitContributions - sumContrib;
    if (0 < otherContributions) {
        languages.push({
            language: OTHER_NAME,
            color: OTHER_COLOR,
            contributions: otherContributions,
        });
    }

    // Override language colors with theme pieColors if provided
    const pieColors = settings.pieColors;
    if (pieColors && pieColors.length > 0) {
        languages.forEach((lang, i) => {
            if (i < pieColors.length) {
                lang.color = pieColors[i];
            }
        });
    }

    const isAnimate = settings.growingAnimation || isForcedAnimation;
    const animateOpacity = (num: number) =>
        Array<string>(languages.length + INTRO_FADE_STEPS)
            .fill('')
            .map((_d, i) => (i < num ? 0 : Math.min((i - num) / INTRO_FADE_STEPS, 1)))
            .join(';');

    const radius = height / 2;
    const margin = radius / 10;

    const row = LABEL_ROW_COUNT;
    const offset = (row - languages.length) / 2 + 0.5;
    const fontSize = height / row / 1.5;

    const pie = d3
        .pie<type.LangInfo>()
        .value((d) => d.contributions)
        .sortValues(null);
    const pieData = pie(languages);

    const group = svg.append('g').attr('transform', `translate(${x}, ${y})`);

    const groupLabel = group.append('g').attr('transform', `translate(${radius * 2.1}, ${0})`);

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
            .attr('values', (_d, i) => animateOpacity(i))
            .attr('dur', INTRO_DURATION)
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
            .attr('values', (_d, i) => animateOpacity(i))
            .attr('dur', INTRO_DURATION)
            .attr('repeatCount', '1');
    }

    const outerRadius = radius - margin;
    const innerRadius = radius / 2;

    const arc = d3
        .arc<d3.PieArcDatum<type.LangInfo>>()
        .outerRadius(outerRadius)
        .innerRadius(innerRadius);

    // Breathing parameters (all effects synchronized)
    const breathDur = BREATH_DURATION_SECONDS;
    const breathSteps = BREATH_KEYFRAMES;
    const breathBegin = BREATH_BEGIN;

    // pie chart
    const pieGroup = group.append('g').attr('transform', `translate(${radius}, ${radius})`);

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

        // Animate blur radius: 0 → peak → 0
        blur.append('animate')
            .attr('attributeName', 'stdDeviation')
            .attr(
                'values',
                Array.from({ length: breathSteps + 1 }, (_, step) => {
                    const t = step / breathSteps;
                    return (GLOW_BLUR_MIN + GLOW_BLUR_RANGE * Math.sin(2 * Math.PI * t)).toFixed(2);
                }).join(';'),
            )
            .attr('dur', `${breathDur}s`)
            .attr('begin', breathBegin)
            .attr('repeatCount', 'indefinite');

        filter.append('feOffset').attr('dx', '0').attr('dy', '0').attr('result', 'offsetBlur');

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
            .attr('values', `1;${1 + BREATH_SCALE_RANGE};1;${1 - BREATH_SCALE_RANGE};1`)
            .attr('dur', `${breathDur}s`)
            .attr('begin', breathBegin)
            .attr('repeatCount', 'indefinite')
            .attr('additive', 'sum');
    }

    // Unified opacity breathing values (all slices together, ease-in-out)
    const breathOpacityValues = Array.from({ length: breathSteps + 1 }, (_, step) => {
        const t = step / breathSteps;
        const v =
            BREATH_OPACITY_MIN + BREATH_OPACITY_RANGE * (0.5 + 0.5 * Math.sin(2 * Math.PI * t));
        return v.toFixed(3);
    }).join(';');

    // Radial breathing: generate arc paths with varying outer radius
    const radiusVariation = BREATH_RADIUS_VARIATION;
    const breathArcPaths = (d: d3.PieArcDatum<type.LangInfo>) => {
        const arcGen = d3.arc<d3.PieArcDatum<type.LangInfo>>().innerRadius(innerRadius);
        return Array.from({ length: breathSteps + 1 }, (_, step) => {
            const t = step / breathSteps;
            const r = outerRadius + radiusVariation * Math.sin(2 * Math.PI * t);
            arcGen.outerRadius(r);
            return arcGen(d);
        }).join(';');
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
    paths.append('title').text((d) => `${d.data.language} ${d.data.contributions}`);

    if (isAnimate) {
        // Intro: sequential fade-in
        paths
            .append('animate')
            .attr('attributeName', 'fill-opacity')
            .attr('values', (_d, i) => animateOpacity(i))
            .attr('dur', INTRO_DURATION)
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
