export interface VersionSpec {
    start: number;
    end?: number;
}

/**
 * Determines whether the given protocol version falls into the provided version specification.
 * @param {number} version The protocol version to check.
 * @param {VersionSpec[]} ranges The version specification to check against.
 * @returns {boolean} Whether the version is compatible with the specification.
 */
export function checkVersion(version: number, ranges: VersionSpec[]) : boolean {
    for (const range of ranges)
        if (version >= range.start) {
            if (range.end) return version <= range.end;
            else return true
        }

    return false;
}

/**
 * Converts a version string into a version specification.
 *
 * NOTE: This handles most cases (including swapping start and end if the order is wrong).
 * The only edge case is if the range is n-0, in which case the start rather than the end will be n.
 * @param {string} spec The version string to convert.
 * @returns {VersionSpec} The version specification.
 */
export function versionSpec(spec: string) : VersionSpec {
    const parts: number[] = spec.split("-").map(Number);

    // Allows 0-n ranges, n-infinity ranges, and specific n
    if (parts.length == 1)
        return {
            start: parts[0],
            end: parts[0]
        };
    else {
        let start: number = parts[0] || 0;
        let end: number = parts[1] || undefined;

        // Do not allow end to be lower than start
        if (end && start > end)
            [start, end] = [end, start];

        return {
            start,
            end
        };
    }
}
