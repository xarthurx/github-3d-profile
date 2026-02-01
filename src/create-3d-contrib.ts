import * as d3 from 'd3';
import * as util from './utils';
import * as type from './type';

const ANGLE = 30;
const DARKER_RIGHT = 1;
const DARKER_LEFT = 0.5;
const DARKER_TOP = 0;

/** Intro grow animation duration */
const GROW_DURATION = '3s';

/** Wave animation parameters (continuous, after grow) */
const WAVE_AMP_RATIO = 0.08;
const WAVE_AMP_MAX = 4;
const WAVE_PHASE_MOD = 16;
const WAVE_CYCLE_SECONDS = 4;
const WAVE_STEPS = 16;

/** Height formula constants: log10(count / DIVISOR + 1) * SCALE + BASE */
const HEIGHT_DIVISOR = 20;
const HEIGHT_SCALE = 144;
const HEIGHT_BASE = 3;

/** Number of horizontal slots (weeks display width) */
const WEEK_SLOTS = 64;

const toEpochDays = (date: Date): number =>
    Math.floor(date.getTime() / (24 * 60 * 60 * 1000));

type PanelType = 'top' | 'left' | 'right';

const addNormalColor = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contribLevel: number,
    panel: PanelType,
): void => {
    path.attr('class', `cont-${panel}-${contribLevel}`);
};

const decideSeasonPatternNo = (date: Date): number => {
    const sunday = new Date(date.getTime());
    sunday.setDate(sunday.getDate() - sunday.getDay());

    const month = sunday.getUTCMonth();
    const dayOfMonth = sunday.getUTCDate();

    const diff =
        dayOfMonth <= 7
            ? 0
            : dayOfMonth <= 14
              ? 1
              : dayOfMonth <= 21
                ? 2
                : dayOfMonth <= 28
                  ? 3
                  : 4;

    switch (month + 1) {
        case 9:
            // summer -> autumn = 0-4
            return 0 + diff;
        case 10:
        case 11:
            // autumn = 4
            return 4;
        case 12:
            // autumn -> winter = 5-9
            return 5 + diff;
        case 1:
        case 2:
            // winter = 9
            return 9;
        case 3:
            // winter -> spring = 10-14
            return 10 + diff;
        case 4:
        case 5:
            // spring = 14
            return 14;
        case 6:
            // spring -> summer = 15-19
            return 15 + diff;
        case 7:
        case 8:
        default:
            // summer = 19
            return 19;
    }
};

const addSeasonColor = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contribLevel: number,
    panel: PanelType,
    date: Date,
): void => {
    const pattern = decideSeasonPatternNo(date);
    path.attr('class', `cont-${panel}-p${pattern}-${contribLevel}`);
};

const addRainbowColor = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contribLevel: number,
    settings: type.RainbowColorSettings,
    darker: number,
    week: number,
): void => {
    const offsetHue = week * settings.hueRatio;
    const saturation = settings.saturation;
    const lightness = settings.contribLightness[contribLevel];
    const values = [...Array<undefined>(7)]
        .map((_, i) => (i * 60 + offsetHue) % 360)
        .map((hue) => `hsl(${hue},${saturation},${lightness})`)
        .map((c) => d3.rgb(c).darker(darker).toString())
        .join(';');

    path.append('animate')
        .attr('attributeName', 'fill')
        .attr('values', values)
        .attr('dur', settings.duration)
        .attr('repeatCount', 'indefinite');
};

const addBitmapPattern = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contributionLevel: number,
    panel: PanelType,
): void => {
    path.attr('fill', `url(#pattern_${contributionLevel}_${panel})`);
};

/** Map from panel type to its darker factor */
const DARKER_BY_PANEL: Record<PanelType, number> = {
    top: DARKER_TOP,
    left: DARKER_LEFT,
    right: DARKER_RIGHT,
};

/** Apply the correct color/pattern to a panel based on settings type */
const applyPanelColor = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contribLevel: number,
    panel: PanelType,
    settings: type.FullSettings,
    date: Date,
    week: number,
): void => {
    if (settings.type === 'normal') {
        addNormalColor(path, contribLevel, panel);
    } else if (settings.type === 'season') {
        addSeasonColor(path, contribLevel, panel, date);
    } else if (settings.type === 'rainbow') {
        addRainbowColor(path, contribLevel, settings, DARKER_BY_PANEL[panel], week);
    } else if (settings.type === 'bitmap') {
        addBitmapPattern(path, contribLevel, panel);
    }
};

const atan = (value: number) => (Math.atan(value) * 360) / 2 / Math.PI;

const addPatternForBitmap = (
    defs: d3.Selection<SVGDefsElement, unknown, null, unknown>,
    panelPattern: type.PanelPattern,
    contributionLevel: number,
    panel: PanelType,
): void => {
    const width = Math.max(1, panelPattern.width);
    const height = Math.max(1, panelPattern.bitmap.length);
    const pattern = defs
        .append('pattern')
        .attr('id', `pattern_${contributionLevel}_${panel}`)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('patternUnits', 'userSpaceOnUse');
    pattern
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('class', `cont-${panel}-bg-${contributionLevel}`);
    const path = d3.path();
    for (const [y, bitmapValue] of panelPattern.bitmap.entries()) {
        const bitmap =
            typeof bitmapValue === 'string'
                ? parseInt(bitmapValue, 16)
                : bitmapValue;
        for (let x = 0; x < width; x++) {
            if ((bitmap & (1 << (width - x - 1))) !== 0) {
                path.rect(x, y, 1, 1);
            }
        }
    }
    pattern
        .append('path')
        .attr('stroke', 'none')
        .attr('class', `cont-${panel}-fg-${contributionLevel}`)
        .attr('d', path.toString());
};

export const addDefines = (
    svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    settings: type.Settings,
): void => {
    if (settings.type === 'bitmap') {
        const defs = svg.append('defs');
        for (const [contribLevel, info] of settings.contribPatterns.entries()) {
            addPatternForBitmap(defs, info.top, contribLevel, 'top');
            addPatternForBitmap(defs, info.left, contribLevel, 'left');
            addPatternForBitmap(defs, info.right, contribLevel, 'right');
        }
    }
};

export const create3DContrib = (
    svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    userInfo: type.UserInfo,
    x: number,
    y: number,
    width: number,
    height: number,
    settings: type.FullSettings,
    isForcedAnimation = false,
): void => {
    if (userInfo.contributionCalendar.length === 0) {
        return;
    }

    const firstDate = userInfo.contributionCalendar[0].date;
    const sundayOfFirstWeek = toEpochDays(firstDate) - firstDate.getUTCDay();
    const weekcount = Math.ceil(
        (userInfo.contributionCalendar.length + firstDate.getUTCDay()) / 7.0,
    );
    const dx = width / WEEK_SLOTS;
    const dy = dx * Math.tan(ANGLE * ((2 * Math.PI) / 360));
    const dxx = dx * 0.9;
    const dyy = dy * 0.9;

    const offsetX = dx * 7;
    const offsetY = height - (weekcount + 7) * dy;

    const group = svg.append('g');

    userInfo.contributionCalendar.forEach((cal) => {
        const week = Math.floor(
            (toEpochDays(cal.date) - sundayOfFirstWeek) / 7,
        );
        const dayOfWeek = cal.date.getUTCDay(); // sun = 0, mon = 1, ...

        const baseX = offsetX + (week - dayOfWeek) * dx;
        const baseY = offsetY + (week + dayOfWeek) * dy;
        const calHeight = Math.log10(cal.contributionCount / HEIGHT_DIVISOR + 1) * HEIGHT_SCALE + HEIGHT_BASE;
        const contribLevel = cal.contributionLevel;

        const isAnimate = settings.growingAnimation || isForcedAnimation;

        const bar = group
            .append('g')
            .attr(
                'transform',
                `translate(${util.toFixed(baseX)} ${util.toFixed(
                    baseY - calHeight,
                )})`,
            );
        if (isAnimate && contribLevel !== 0) {
            bar.append('animateTransform')
                .attr('attributeName', 'transform')
                .attr('type', 'translate')
                .attr(
                    'values',
                    `${util.toFixed(baseX)} ${util.toFixed(
                        baseY - HEIGHT_BASE,
                    )};${util.toFixed(baseX)} ${util.toFixed(
                        baseY - calHeight,
                    )}`,
                )
                .attr('dur', GROW_DURATION)
                .attr('repeatCount', '1');

            // Wave effect: subtle vertical oscillation after grow completes
            const waveAmp = Math.min(calHeight * WAVE_AMP_RATIO, WAVE_AMP_MAX);
            const wavePhase = (week + dayOfWeek) % WAVE_PHASE_MOD;
            const waveValues = Array.from({ length: WAVE_STEPS + 1 }, (_, i) => {
                const t = i / WAVE_STEPS;
                const phaseOffset = (wavePhase / WAVE_PHASE_MOD) * 2 * Math.PI;
                const offset = waveAmp * Math.sin(2 * Math.PI * t + phaseOffset);
                return `${util.toFixed(baseX)} ${util.toFixed(baseY - calHeight + offset)}`;
            }).join(';');

            bar.append('animateTransform')
                .attr('attributeName', 'transform')
                .attr('type', 'translate')
                .attr('values', waveValues)
                .attr('dur', `${WAVE_CYCLE_SECONDS}s`)
                .attr('begin', GROW_DURATION)
                .attr('repeatCount', 'indefinite');
        }

        const widthTop =
            settings.type === 'bitmap'
                ? Math.max(1, settings.contribPatterns[contribLevel].top.width)
                : dxx;
        const topPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthTop))
            .attr('height', util.toFixed(widthTop))
            .attr(
                'transform',
                `skewY(${-ANGLE}) skewX(${util.toFixed(
                    atan(dxx / 2 / dyy),
                )}) scale(${util.toFixed(dxx / widthTop)} ${util.toFixed(
                    (2 * dyy) / widthTop,
                )})`,
            );

        applyPanelColor(topPanel, contribLevel, 'top', settings, cal.date, week);

        const widthLeft =
            settings.type === 'bitmap'
                ? Math.max(1, settings.contribPatterns[contribLevel].left.width)
                : dxx;
        const scaleLeft = Math.sqrt(dxx ** 2 + dyy ** 2) / widthLeft;
        const heightLeft = calHeight / scaleLeft;
        const leftPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthLeft))
            .attr('height', util.toFixed(heightLeft))
            .attr(
                'transform',
                `skewY(${ANGLE}) scale(${util.toFixed(
                    dxx / widthLeft,
                )} ${util.toFixed(scaleLeft)})`,
            );

        applyPanelColor(leftPanel, contribLevel, 'left', settings, cal.date, week);
        if (isAnimate && contribLevel !== 0) {
            leftPanel
                .append('animate')
                .attr('attributeName', 'height')
                .attr(
                    'values',
                    `${util.toFixed(HEIGHT_BASE / scaleLeft)};${util.toFixed(heightLeft)}`,
                )
                .attr('dur', GROW_DURATION)
                .attr('repeatCount', '1');
        }

        const widthRight =
            settings.type === 'bitmap'
                ? Math.max(
                      1,
                      settings.contribPatterns[contribLevel].right.width,
                  )
                : dxx;
        const scaleRight = Math.sqrt(dxx ** 2 + dyy ** 2) / widthRight;
        const heightRight = calHeight / scaleRight;
        const rightPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthRight))
            .attr('height', util.toFixed(heightRight))
            .attr(
                'transform',
                `translate(${util.toFixed(dxx)} ${util.toFixed(
                    dyy,
                )}) skewY(${-ANGLE}) scale(${util.toFixed(
                    dxx / widthRight,
                )} ${util.toFixed(scaleRight)})`,
            );

        applyPanelColor(rightPanel, contribLevel, 'right', settings, cal.date, week);
        if (isAnimate && contribLevel !== 0) {
            rightPanel
                .append('animate')
                .attr('attributeName', 'height')
                .attr(
                    'values',
                    `${util.toFixed(HEIGHT_BASE / scaleRight)};${util.toFixed(
                        heightRight,
                    )}`,
                )
                .attr('dur', GROW_DURATION)
                .attr('repeatCount', '1');
        }
    });
};
