import * as d3 from 'd3';
import { JSDOM } from 'jsdom';
import * as contrib from './create-3d-contrib';
import * as colors from './create-css-colors';
import * as pie from './create-pie-language';
import * as radar from './create-radar-contrib';
import type * as type from './type';
import * as util from './utils';

/** Full SVG canvas dimensions */
const SVG_WIDTH = 1280;
const SVG_HEIGHT = 850;

/** Pie chart sizing */
const PIE_HEIGHT = 200 * 1.3;
const PIE_WIDTH = PIE_HEIGHT * 2;

/** Radar chart sizing and position */
const RADAR_WIDTH = 400 * 1.3;
const RADAR_HEIGHT = (RADAR_WIDTH * 3) / 4;
const RADAR_X = SVG_WIDTH - RADAR_WIDTH - 40;

/** Padding around card backgrounds */
const CARD_PADDING = 12;
const CARD_RADIUS = 12;
const CARD_OPACITY = '0.3';

/** Stats bar layout */
const STATS_X = 50;
const STATS_FONT_SIZE_VALUE = '22px';
const STATS_FONT_SIZE_LABEL = '16px';
const STATS_STAR_X = 280;
const STATS_FORK_X = 390;

/** Radar chart Y offset from top */
const RADAR_Y = 70;

export const createSvg = (
    userInfo: type.UserInfo,
    settings: type.Settings,
    isForcedAnimation: boolean,
): string => {
    let svgWidth = SVG_WIDTH;
    let svgHeight = SVG_HEIGHT;
    if (settings.type === 'pie_lang_only') {
        svgWidth = PIE_WIDTH;
        svgHeight = PIE_HEIGHT;
    } else if (settings.type === 'radar_contrib_only') {
        svgWidth = RADAR_WIDTH;
        svgHeight = RADAR_HEIGHT;
    }

    const fakeDom = new JSDOM(
        '<!DOCTYPE html><html><body><div class="container"></div></body></html>',
    );
    const container = d3.select(fakeDom.window.document).select('.container');
    const svg = container
        .append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    svg.append('style').html(
        [
            '* { font-family: "Ubuntu", "Helvetica", "Arial", sans-serif; }',
            colors.createCssColors(settings),
        ].join('\n'),
    );

    contrib.addDefines(svg, settings);

    // background gradient
    if (settings.type !== 'pie_lang_only' && settings.type !== 'radar_contrib_only') {
        const bgColor = d3.rgb(settings.backgroundColor);
        const isLight = (bgColor.r * 299 + bgColor.g * 587 + bgColor.b * 114) / 1000 > 128;
        const bottomColor = isLight ? bgColor.darker(0.06) : bgColor.brighter(0.08);
        const defs = svg.append('defs');
        const grad = defs
            .append('linearGradient')
            .attr('id', 'bg-gradient')
            .attr('x1', '0')
            .attr('y1', '0')
            .attr('x2', '0')
            .attr('y2', '1');
        grad.append('stop').attr('offset', '0%').attr('stop-color', settings.backgroundColor);
        grad.append('stop').attr('offset', '100%').attr('stop-color', bottomColor.toString());
        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .attr('fill', 'url(#bg-gradient)');
    } else {
        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .attr('class', 'fill-bg');
    }

    if (settings.type === 'pie_lang_only') {
        // pie chart only
        pie.createPieLanguage(
            svg,
            userInfo,
            0,
            0,
            PIE_WIDTH,
            PIE_HEIGHT,
            settings,
            isForcedAnimation,
        );
    } else if (settings.type === 'radar_contrib_only') {
        // radar chart only
        radar.createRadarContrib(
            svg,
            userInfo,
            0,
            0,
            RADAR_WIDTH,
            RADAR_HEIGHT,
            settings,
            isForcedAnimation,
        );
    } else {
        // 3D-Contrib Calendar
        contrib.create3DContrib(
            svg,
            userInfo,
            0,
            0,
            SVG_WIDTH,
            SVG_HEIGHT,
            settings,
            isForcedAnimation,
        );

        // card background behind radar chart
        svg.append('rect')
            .attr('x', RADAR_X - CARD_PADDING)
            .attr('y', RADAR_Y - CARD_PADDING)
            .attr('width', RADAR_WIDTH + CARD_PADDING * 2)
            .attr('height', RADAR_HEIGHT + CARD_PADDING * 2)
            .attr('rx', CARD_RADIUS)
            .attr('ry', CARD_RADIUS)
            .attr('class', 'fill-bg')
            .style('opacity', CARD_OPACITY);

        // radar chart
        radar.createRadarContrib(
            svg,
            userInfo,
            RADAR_X,
            RADAR_Y,
            RADAR_WIDTH,
            RADAR_HEIGHT,
            settings,
            isForcedAnimation,
        );

        const pieX = STATS_X;
        const pieY = SVG_HEIGHT - PIE_HEIGHT - 60;

        // card background behind pie chart
        svg.append('rect')
            .attr('x', pieX - CARD_PADDING)
            .attr('y', pieY - CARD_PADDING)
            .attr('width', PIE_WIDTH + CARD_PADDING * 2)
            .attr('height', PIE_HEIGHT + CARD_PADDING * 2)
            .attr('rx', CARD_RADIUS)
            .attr('ry', CARD_RADIUS)
            .attr('class', 'fill-bg')
            .style('opacity', CARD_OPACITY);

        // pie chart
        pie.createPieLanguage(
            svg,
            userInfo,
            pieX,
            pieY,
            PIE_WIDTH,
            PIE_HEIGHT,
            settings,
            isForcedAnimation,
        );

        const group = svg.append('g');

        // Stats bar: left-aligned below pie chart (compact, evenly spaced)
        const positionYContrib = SVG_HEIGHT - 30;

        group
            .append('text')
            .style('font-size', STATS_FONT_SIZE_VALUE)
            .style('font-weight', '600')
            .attr('x', STATS_X)
            .attr('y', positionYContrib)
            .attr('text-anchor', 'start')
            .text(util.inertThousandSeparator(userInfo.totalContributions))
            .attr('class', 'fill-strong');

        const contribLabel = settings.l10n ? settings.l10n.contrib : 'contributions';
        group
            .append('text')
            .style('font-size', STATS_FONT_SIZE_LABEL)
            .attr('x', STATS_X + 60)
            .attr('y', positionYContrib)
            .attr('text-anchor', 'start')
            .text(contribLabel)
            .attr('class', 'fill-fg');

        // icon of star
        group
            .append('g')
            .attr(
                'transform',
                `translate(${STATS_STAR_X - 24}, ${positionYContrib - 21}), scale(1.5)`,
            )
            .style('opacity', '0.9')
            .append('path')
            .attr('fill-rule', 'evenodd')
            .attr(
                'd',
                'M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z',
            )
            .attr('class', 'fill-fg');

        group
            .append('text')
            .style('font-size', STATS_FONT_SIZE_VALUE)
            .style('font-weight', '600')
            .attr('x', STATS_STAR_X + 6)
            .attr('y', positionYContrib)
            .attr('text-anchor', 'start')
            .text(util.toScale(userInfo.totalStargazerCount))
            .attr('class', 'fill-fg')
            .append('title')
            .text(userInfo.totalStargazerCount);

        // icon of fork
        group
            .append('g')
            .attr(
                'transform',
                `translate(${STATS_FORK_X - 24}, ${positionYContrib - 21}), scale(1.5)`,
            )
            .style('opacity', '0.9')
            .append('path')
            .attr('fill-rule', 'evenodd')
            .attr(
                'd',
                'M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z',
            )
            .attr('class', 'fill-fg');

        group
            .append('text')
            .style('font-size', STATS_FONT_SIZE_VALUE)
            .style('font-weight', '600')
            .attr('x', STATS_FORK_X + 4)
            .attr('y', positionYContrib)
            .attr('text-anchor', 'start')
            .text(util.toScale(userInfo.totalForkCount))
            .attr('class', 'fill-fg')
            .append('title')
            .text(userInfo.totalForkCount);

        // ISO 8601 format
        const startDate = userInfo.contributionCalendar[0].date;
        const endDate =
            userInfo.contributionCalendar[userInfo.contributionCalendar.length - 1].date;
        const period = `${util.toIsoDate(startDate)} / ${util.toIsoDate(endDate)}`;

        group
            .append('text')
            .style('font-size', STATS_FONT_SIZE_LABEL)
            .attr('x', SVG_WIDTH - 20)
            .attr('y', 20)
            .attr('dominant-baseline', 'hanging')
            .attr('text-anchor', 'end')
            .text(period)
            .attr('class', 'fill-weak');
    }
    return container.html();
};
