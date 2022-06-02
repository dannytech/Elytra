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
        if (range.start <= version && version <= range.end)
            return true;

    return false;
}
