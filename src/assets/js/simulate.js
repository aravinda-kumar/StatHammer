(function (root) {
    "use strict";

    const iter = 5000;

    var simulate = {};

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      }

    // Define a "class" to represent results
    function Interface() {
        this.drollAPI = null;
        this.statAPI = null;
    };

    function SimulateStat() {
        this.diceFmt = '';
        this.rolls = [];
        this.histogram = {};
        this.minResult = 0;
        this.maxResult = 0;
        this.mean = 0;
        this.stdev = 0;
        this.median = 0;
        this.rerolls = '-';
        this.minTarget = -1;
        this.maxTarget = -1;
        this.rerollVal = [];
        this.percentile50 = 0;
    }

    function SimulateResult() {
        this.nbHits = 0;
        this.nbWounds = 0;
        this.nbWoundSaved = 0;
        this.nbDamage = 0;
        this.nbMortalDamage = 0;
        this.nbDamageSaved = 0;
        this.nbDead = 0;
    }

    simulate.init = function (droll, stats) {
        var api = new Interface();

        api.drollAPI = droll;
        api.statAPI = stats;

        return api;
    }

    Interface.prototype.alwaysSuccessProb = function()
    {
        var result = new SimulateStat();
        result.diceFmt = 'A';
        return result;
    }

    Interface.prototype.alwaysFailProb = function()
    {
        var result = new SimulateStat();
        result.diceFmt = 'F';
        return result;
    }

    Interface.prototype.computeValueProb = function(distribution, target) {
        console.dir(target);

        // Compute probability value based on target 
        if(distribution.diceFmt === 'A') {
            return 1;
        } else if(distribution.diceFmt === 'F') {
            return 0;
        }
        var percentile = 1 - target / 100;
        if(percentile < 0) {
            percentile = 0;
        } else if(percentile > 1) {
            percentile = 1;
        }

        var value = Math.round(this.statAPI.percentile(distribution.rolls, percentile));
        console.dir(value);
        return value;
    }

    Interface.prototype.computeSuccessProb = function(distribution, target) {
        console.dir(target);
        console.dir(distribution);

        // Compute probability [0-1] based on target 
        if(distribution.diceFmt === 'A') {
            return 1;
        } else if(distribution.diceFmt === 'F') {
            return 0;
        }

        // Check 
        var percentile = 1 - target / 100;
        if(percentile < 0) {
            percentile = 0;
        } else if(percentile > 1) {
            percentile = 1;
        }

        // Check if we have a min target or a max target (or no target)
        var prob = percentile;  // If no target, then we return the confidence asked
        if(distribution.minTarget !== distribution.maxTarget) {
            if(percentile > 0.5) percentile = 0.5; // in that case we cannot be better than the actual probability
            var count = 0;
            prob = 0;
            var min = distribution.minTarget === -1 ? distribution.minResult : distribution.minTarget;
            var max = distribution.maxTarget === -1 ? distribution.maxResult : distribution.maxTarget;
            var range = (max - min);
            // apply percentile as percentile of range
            if(distribution.minTarget !== -1) {
                min += Math.round(range * (1 - 2 * percentile));
            }
            if(distribution.maxTarget !== -1) {
                max -= Math.round(range * (1 - 2 * percentile));
            }
            var target = min;
            while(target <= max) {
                var id = Math.round((target - distribution.histogram.binLimits[0]) / distribution.histogram.binWidth);
                prob += distribution.histogram.values[id];
                count++;
                target += distribution.histogram.binWidth;
            }
        }

        console.dir(prob);
        return prob;
    }

    Interface.prototype.computeDistribution = function (dice, rerolls = '-', minTarget = -1, maxTarget = -1, rerollVal = []) {
        var result = new SimulateStat();

        var formula = this.drollAPI.parse(dice);
        result.minResult = formula.minResult;
        result.maxResult = formula.maxResult;
        result.rerolls = rerolls;
        result.minTarget = isNumber(minTarget) ? parseInt(minTarget) : -1;
        result.maxTarget = isNumber(maxTarget) ? parseInt(maxTarget) : -1;;
        result.rerollVal = rerollVal;

        for (var n = 0; n < iter; n++) {
            // Roll dice
            var roll = this.drollAPI.roll(dice);

            // Check if we meet one of the target
            var reroll = false;
            if (minTarget !== -1 && maxTarget !== -1) {
                var success = true;
                if (minTarget !== -1 && roll.sum < minTarget) success = false;
                if (maxTarget !== -1 && roll.sum > maxTarget) success = false;
                if (!success) {
                    reroll = true; // Need to reroll if possible as not successfull
                }
            }

            // Shall we reroll?
            var rerollDice = [];
            if (reroll && (rerollVal.length > 0 || rerolls !== '-')) {
                for(var i = 0; i < roll.rolls.length; i++) {
                    if(rerolls === 'all') {
                        rerollDice.push(i);
                    } else if(rerolls === 'one' && roll.rolls[i] === 1) {
                        rerollDice.push(i);
                    } else {
                        rerollVall.forEach(function(val) {
                            if(val === roll.rolls[i]) {
                                rerollDice.push(i);
                            }
                        });
                    }
                }
            }
            if (reroll) roll = this.drollAPI.reroll(dice);

            // 
            result.rolls.push(roll.total);
        }

        result.diceFmt = dice;
        result.histogram = this.statAPI.histogramIncr(result.rolls, 1, true);
        result.mean = this.statAPI.mean(result.rolls);
        result.median = this.statAPI.median(result.rolls);
        result.stdev = this.statAPI.stdev(result.rolls);

        return result;
    }

    Interface.prototype.join = function (hitStat, suppHitStat, woundStat, suppWoundStat, mortalWoundStat, damageStat, saveStat, invSaveStat, fnpStat, count, toHit, toWound, percentile) {

    }

    // Export library for use in node.js or browser
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = simulate;
    } else {
        root.simulate = simulate;
    }

}(this));