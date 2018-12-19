(function (root) {
    "use strict";

    var stats = {};

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      }
      
    stats.numbers = function (vals) {
        var nums = []
        if (vals == null)
            return nums

        for (var i = 0; i < vals.length; i++) {
            if (isNumber(vals[i]))
                nums.push(+vals[i])
        }
        return nums
    }

    function nsort(vals) {
        return vals.sort(function numericSort(a, b) {
            return a - b
        })
    }

    stats.sum = function (vals) {
        vals = stats.numbers(vals)
        var total = 0
        for (var i = 0; i < vals.length; i++) {
            total += vals[i]
        }
        return total
    }

    stats.mean = function (vals) {
        vals = stats.numbers(vals)
        if (vals.length === 0) return NaN
        return (stats.sum(vals) / vals.length)
    }

    stats.median = function (vals) {
        vals = stats.numbers(vals)
        if (vals.length === 0) return NaN

        var half = (vals.length / 2) | 0

        vals = nsort(vals)
        if (vals.length % 2) {
            // Odd length, true middle element
            return vals[half]
        } else {
            // Even length, average middle two elements
            return (vals[half - 1] + vals[half]) / 2.0
        }
    }

    // Returns the mode of a unimodal dataset
    // If the dataset is multi-modal, returns a Set containing the modes
    stats.mode = function (vals) {
        vals = stats.numbers(vals)
        if (vals.length === 0) return NaN
        var mode = NaN
        var dist = {}

        for (var i = 0; i < vals.length; i++) {
            var value = vals[i]
            var me = dist[value] || 0
            me++
            dist[value] = me
        }

        var rank = stats.numbers(Object.keys(dist).sort(function sortMembers(a, b) {
            return dist[b] - dist[a]
        }))
        mode = rank[0]
        if (dist[rank[1]] == dist[mode]) {
            // multi-modal
            if (rank.length == vals.length) {
                // all values are modes
                return vals
            }
            var modes = new Set([mode])
            var modeCount = dist[mode]
            for (var i = 1; i < rank.length; i++) {
                if (dist[rank[i]] == modeCount) {
                    modes.add(rank[i])
                } else {
                    break
                }
            }
            return modes
        }
        return mode
    }

    // This helper finds the mean of all the values, then squares the difference
    // from the mean for each value and returns the resulting array.  This is the
    // core of the varience functions - the difference being dividing by N or N-1.
    function valuesMinusMeanSquared(vals) {
        vals = stats.numbers(vals)
        var avg = stats.mean(vals)
        var diffs = []
        for (var i = 0; i < vals.length; i++) {
            diffs.push(Math.pow((vals[i] - avg), 2))
        }
        return diffs
    }

    // Population Variance = average squared deviation from mean
    stats.variance = function (vals) {
        return stats.mean(valuesMinusMeanSquared(vals))
    }

    // Sample Variance
    stats.sampleVariance = function (vals) {
        var diffs = valuesMinusMeanSquared(vals)
        if (diffs.length <= 1) return NaN

        return sum(diffs) / (diffs.length - 1)
    }


    // Population Standard Deviation = sqrt of population variance
    stats.stdev = function (vals) {
        return Math.sqrt(stats.variance(vals))
    }

    // Sample Standard Deviation = sqrt of sample variance
    stats.sampleStdev = function (vals) {
        return Math.sqrt(stats.sampleVariance(vals))
    }

    stats.percentile = function (vals, ptile) {
        vals = stats.numbers(vals)
        if (vals.length === 0 || ptile == null || ptile < 0) return NaN

        // Fudge anything over 100 to 1.0
        if (ptile > 1) ptile = 1
        vals = nsort(vals)
        var i = (vals.length * ptile) - 0.5
        if ((i | 0) === i) return vals[i]
        // interpolated percentile -- using Estimation method
        var int_part = i | 0
        var fract = i - int_part
        return (1 - fract) * vals[int_part] + fract * vals[Math.min(int_part + 1, vals.length - 1)]
    }

    stats.histogramIncr = function(vals, incr, normalize = true) {
        if (vals == null) {
            return null
        }
        vals = nsort(stats.numbers(vals))
        if (vals.length === 0) {
            return null
        }
        var min = vals[0]
        var max = vals[vals.length - 1]
        var range = (max - min) + 1

        if(max === min) {
            var hist = {
                values: Array(1).fill(0),
                bins: 1,
                binWidth: incr,
                binLimits: [min, max]
            }
            hist.values[0] = vals.length;
            if(normalize) hist.values[0] = 1;
            return hist;
        }

        var bins = range / incr;
        bins = Math.round(bins)
        if (bins < 1) {
            bins = 1
        }

        var hist = {
            values: Array(bins).fill(0),
            bins: bins,
            binWidth: incr,
            binLimits: [min, min + (incr * (bins-1))]
        }

        var binIndex = 0
        for (var i = 0; i < vals.length; i++) {
            while (vals[i] >= (((binIndex + 1) * incr) + min)) {
                binIndex++
            }
            hist.values[binIndex]++
        }
        if(normalize) {
            for(var i = 0; i < hist.values.length; i++) {
                hist.values[i] /= vals.length;
            }
        }
        return hist
    }

    stats.histogram = function (vals, bins, normalize = false) {
        if (vals == null) {
            return null
        }
        vals = nsort(stats.numbers(vals))
        if (vals.length === 0) {
            return null
        }
        if (bins == null) {
            // pick bins by simple method: Math.sqrt(n)
            bins = Math.sqrt(vals.length)
        }
        bins = Math.round(bins)
        if (bins < 1) {
            bins = 1
        }

        var min = vals[0]
        var max = vals[vals.length - 1]
        if (min === max) {
            // fudge for non-variant data
            min = min - 0.5
            max = max + 0.5
        }

        var range = (max - min)
        // make the bins slightly larger by expanding the range about 10%
        // this helps with dumb floating point stuff
        var binWidth = (range + (range * 0.05)) / bins
        var midpoint = (min + max) / 2
        // even bin count, midpoint makes an edge
        var leftEdge = midpoint - (binWidth * Math.floor(bins / 2))
        if (bins % 2 !== 0) {
            // odd bin count, center middle bin on midpoint
            var leftEdge = (midpoint - (binWidth / 2)) - (binWidth * Math.floor(bins / 2))
        }

        var hist = {
            values: Array(bins).fill(0),
            bins: bins,
            binWidth: binWidth,
            binLimits: [leftEdge, leftEdge + (binWidth * bins)]
        }

        var binIndex = 0
        for (var i = 0; i < vals.length; i++) {
            while (vals[i] > (((binIndex + 1) * binWidth) + leftEdge)) {
                binIndex++
            }
            hist.values[binIndex]++
        }

        if(normalize) {
            for(var i = 0; i < hist.values.length; i++) {
                hist.values[i] /= vals.length;
            }
        }
        return hist
    }


    // Export library for use in node.js or browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = stats;
    } else {
        root.stats = stats;
    }

}(this));