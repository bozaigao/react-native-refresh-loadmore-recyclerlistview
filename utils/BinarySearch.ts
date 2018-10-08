import CustomError from "../core/exceptions/CustomError";

export default class BinarySearch {
    public static findClosestHigherValueIndex(size: number, targetValue: number, valueExtractor: (index: number) => number): number {
        let low = 0,
         high = size - 1,
         mid = Math.floor((low + high) / 2),
         lastValue = 0,
         absoluteLastDiff = Math.abs(valueExtractor(mid) - targetValue),
         result = mid,
         diff = 0,
         absoluteDiff = 0;

        if (absoluteLastDiff === 0) {
            return result;
        }

        if (high < 0) {
            throw new CustomError({
                message: "The collection cannot be empty",
                type: "InvalidStateException",
            });
        }

        while (low <= high) {
            mid = Math.floor((low + high) / 2);
            lastValue = valueExtractor(mid);
            diff = lastValue - targetValue;
            absoluteDiff = Math.abs(diff);
            if (diff >= 0 && absoluteDiff < absoluteLastDiff) {
                absoluteLastDiff = absoluteDiff;
                result = mid;
            }
            if (targetValue < lastValue) {
                high = mid - 1;
            } else if (targetValue > lastValue) {
                low = mid + 1;
            } else {
                return mid;
            }
        }
        return result;
    }
    public static findIndexOf(array: number[], value: number): number {
        let j = 0,
         length = array.length,
         i = 0;

        while (j < length) {
            i = length + j - 1 >> 1;
            if (value > array[i]) {
                j = i + 1;
            } else if (value < array[i]) {
                length = i;
            } else {
                return i;
            }
        }
        return -1;
    }
}
