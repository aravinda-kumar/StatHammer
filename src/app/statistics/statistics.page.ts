import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Slides } from '@ionic/angular';
import { NgZone } from '@angular/core';

import { AlertController } from '@ionic/angular';
import { Events } from '@ionic/angular';

import { bindNodeCallback } from 'rxjs';

import droll from '../../assets/js/droll';
import stats from '../../assets/js/stats';
import sim from '../../assets/js/simulate';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {

  @ViewChild('attackerSlides') sliderAttacker: Slides;

  constructor(
    public alertController: AlertController,
    public events: Events,
    private zone: NgZone) {
    this.events.subscribe('updateScreen', () => {
      this.zone.run(() => {
        console.log('force update the screen');
      });
    });
  }

  public slideOpts = {
    effect: 'slide',
    loop: false,
    autoplay: 50000
  };

  public defenderSlideOpts = {
    effect: 'slide',
    loop: false,
    autoplay: 50000
  };

  public statisticsSlideOpts = {
    effect: 'flip',
    loop: false,
    autoplay: 50000
  };

  public attackersSlideOpts = {
    effect: 'slide',
    loop: false,
    autoplay: 50000
  };

  public defenderTemplate = {
    geq: 'outline',
    meq: 'outline',
    veq: 'outline',
    keq: 'outline'
  };
  public currentDefenderTmp = '';

  public properties = {
    name: 'New',
    defender: {
      cost: 10,
      toughness: 4,
      wounds: 1,
      save: '5',
      invSave: '-',
      rerollSave: true,
      rerollInvSave: false,
      ignoreDamage: '5',
      hitModifier: 0
    }
  };

  public results = {
    probability: 50,
    shotCount: 0,
    hitCount: 0,
    woundCount: 0,
    unsavedWoundCount: 0,
    totalDamage: 0,
    modelDead: 0
  };

  public attackerLst = [];


  ngOnInit() {
    // Adding one attacker to the list
    this.attackerLst.push({
      cost: 10,
      hitStat: '3',
      weaponShot: '1',
      weaponS: '3',
      weaponAP: '-',
      weaponD: '1',
      hitRollMod: '+0',
      woundRollMod: '+0',
      rerollShots: '-',
      rerollWounds: '-',
      autoWound6: false,
      autoHit6: false,
      apOn6: '-',
      dmgOn6: '-',
      mortalOn6: '-',
      shotCountOn6: '-'
    });
  }

  public setDefenderTmp(tmpl) {

    if (this.currentDefenderTmp === tmpl) {
      this.defenderTemplate[tmpl] = 'outline';
      return;
    }
    // Set defender template according to tmpl
    this.defenderTemplate = {
      geq: 'outline',
      meq: 'outline',
      veq: 'outline',
      keq: 'outline'
    };
    this.currentDefenderTmp = tmpl;

    switch (tmpl) {
      case 'geq':
        this.properties.defender.toughness = 3;
        this.properties.defender.wounds = 1;
        this.properties.defender.save = '5';
        this.properties.defender.invSave = '-';
        this.properties.defender.ignoreDamage = '-';
        this.properties.defender.rerollInvSave = false;
        this.properties.defender.rerollSave = false;
        this.properties.defender.hitModifier = 0;
        this.defenderTemplate.geq = 'solid';
        break;
      case 'meq':
        this.properties.defender.toughness = 4;
        this.properties.defender.wounds = 1;
        this.properties.defender.save = '3';
        this.properties.defender.invSave = '-';
        this.properties.defender.ignoreDamage = '-';
        this.properties.defender.rerollInvSave = false;
        this.properties.defender.rerollSave = false;
        this.properties.defender.hitModifier = 0;

        this.defenderTemplate.meq = 'solid';
        break;
      case 'veq':
        this.properties.defender.toughness = 7;
        this.properties.defender.wounds = 10;
        this.properties.defender.save = '3';
        this.properties.defender.invSave = '-';
        this.properties.defender.ignoreDamage = '-';
        this.properties.defender.rerollInvSave = false;
        this.properties.defender.rerollSave = false;
        this.properties.defender.hitModifier = 0;

        this.defenderTemplate.veq = 'solid';
        break;
      case 'keq':
        this.properties.defender.toughness = 8;
        this.properties.defender.wounds = 25;
        this.properties.defender.save = '3';
        this.properties.defender.invSave = '5';
        this.properties.defender.ignoreDamage = '-';
        this.properties.defender.rerollInvSave = false;
        this.properties.defender.rerollSave = false;
        this.properties.defender.hitModifier = 0;
        this.defenderTemplate.keq = 'solid';
        break;
    }
  }

  public addAttacker() {
    this.attackerLst.push({
      cost: 10,
      hitStat: '3',
      weaponShot: '1',
      weaponS: '3',
      weaponAP: '-',
      weaponD: '1',
      hitRollMod: '+0',
      woundRollMod: '+0',
      rerollShots: '-',
      rerollWounds: '-',
      autoWound6: false,
      autoHit6: false,
      apOn6: '-',
      dmgOn6: '-',
      mortalOn6: '-',
      shotCountOn6: '-'
    });
  }

  async alertYesNoDelete(yesCb, noCb) {
    const alert = await this.alertController.create({
      header: 'Please confirm.',
      message: 'Do you want to delete this item?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            noCb();
          }
        }, {
          text: 'Yes',
          handler: () => {
            yesCb();
          }
        }
      ]
    });

    await alert.present();
  }

  public delAttacker() {
    const thisObj = this;
    this.alertYesNoDelete(() => {
      thisObj.sliderAttacker.getActiveIndex().then((idx) => {
        if (idx !== 0) {
          thisObj.attackerLst.splice(idx, 1);
          this.events.publish('updateScreen');
          thisObj.sliderAttacker.update();
        }
      });
    }, () => {
    });
  }

  public throwDice() {
    const thisObj = this;

    function updateWithModifier(stat, modifier) {
      if (modifier === 'A') {
        return 'A';
      }
      if (modifier !== '-') {
        return stat + modifier;
      }
      return stat;
    }

    function getToWoundMin(strength: number, autoWound: number, toughness: number) {
      let stat = 4;
      if (strength === toughness) {
        stat = 4;
      } else if (strength >= 2 * toughness) {
        stat = 2;
      } else if (strength > toughness) {
        stat = 3;
      } else if (strength <= toughness * 0.5) {
        stat = 6;
      } else if (strength < toughness) {
        stat = 5;
      }

      if (autoWound > 0 && stat > autoWound) {
        stat = autoWound;
      }
      return stat;
    }

    function getToHitMin(hitStat, autoHit, hitMod) {
      let stat = parseInt(hitStat) + parseInt(hitMod);
      if (autoHit > 0 && stat > autoHit) {
        stat = autoHit;
      }
      return stat;
    }

    function computeForEachAttacker(attLst) {
      attLst.forEach(function (attacker) {
        const simAPI = sim.init(droll, stats);

        // Shots
        attacker.shotProb = simAPI.computeDistribution(attacker.weaponShot);

        // Hit
        let dice = updateWithModifier('D6', attacker.hitRollMod);
        attacker.hitProb = dice === 'A' ? simAPI.alwaysSuccessProb() :
          simAPI.computeDistribution(dice, attacker.rerollShots,
            getToHitMin(attacker.hitStat, attacker.autoHit6 ? 6 : 0, thisObj.properties.defender.hitModifier));

        // D6 hit prob
        attacker.hitSixProb = simAPI.computeDistribution('D6', '-', 6);

        // Wound
        dice = updateWithModifier('D6', attacker.woundRollMod);
        attacker.woundProb = simAPI.computeDistribution('D6', attacker.rerollWounds,
          getToWoundMin(attacker.weaponS, attacker.autoWound6 ? 6 : 0, thisObj.properties.defender.toughness));

        // D6 wound prob
        attacker.woundSixProb = simAPI.computeDistribution('D6', '-', 6);

        // Save
        dice = updateWithModifier('D6', attacker.weaponAP);
        attacker.saveProb = thisObj.properties.defender.save === '-' ? simAPI.alwaysFailProb() :
          simAPI.computeDistribution(dice, '-', thisObj.properties.defender.save);

        if (attacker.apOn6 !== '-') {
          dice = updateWithModifier('D6', attacker.apOn6);
          attacker.saveOn6Prob = thisObj.properties.defender.save === '-' ? simAPI.alwaysFailProb() :
            simAPI.computeDistribution(dice, '-', thisObj.properties.defender.save);
        }

        // InvSave
        attacker.invSaveProb = thisObj.properties.defender.invSave === '-' ? simAPI.alwaysFailProb() :
          simAPI.computeDistribution('D6', '-', thisObj.properties.defender.invSave);

        // FNP
        attacker.fnpProb = thisObj.properties.defender.ignoreDamage === '-' ? simAPI.alwaysFailProb() :
          simAPI.computeDistribution('D6', '-', thisObj.properties.defender.ignoreDamage);

        // Regular Damage
        attacker.damageProb = simAPI.computeDistribution(attacker.weaponD);

      });
    }

    // Compute statistics for all attackers
    computeForEachAttacker(this.attackerLst);

    // Aggregate results 
    this.aggregateProbabilities();
  }

  public aggregateProbabilities() {
    const localThis = this;
    const simAPI = sim.init(droll, stats);

    let summary = {
      probability: localThis.results.probability,
      shotCount: 0,
      hitCount: 0,
      woundCount: 0,
      unsavedWoundCount: 0,
      totalDamage: 0,
      modelDead: 0,
      addShotCount: 0,
      mortalCount: 0,
      modifAPCount: 0,
      damageSixCount: 0,
      damageCount: 0,
      fnpCount: 0
    };

    function combineProbability(attacker, defender, prob: number) {
      let result = {
        shotCount: 0,
        hitCount: 0,
        woundCount: 0,
        unsavedWoundCount: 0,
        totalDamage: 0,
        modelDead: 0,
        addShotCount: 0,
        mortalCount: 0,
        modifAPCount: 0,
        damageSixCount: 0,
        damageCount: 0,
        fnpCount: 0
      };

      // # of shots 
      result.shotCount = simAPI.computeValueProb(attacker.shotProb, prob);

      // # additional shot counts
      result.addShotCount = attacker.shotCountOn6 !== '-' ? result.shotCount * simAPI.computeSuccessProb(attacker.hitSixProb, prob) : 0;

      // # hit (shot * hitProb)
      result.hitCount = simAPI.computeSuccessProb(attacker.hitProb, prob) * (result.shotCount + result.addShotCount);

      // # wounds
      result.woundCount = simAPI.computeSuccessProb(attacker.woundProb, prob) * result.hitCount;

      // # additional wound counts
      result.mortalCount = attacker.mortalOn6 !== '-' ? result.woundCount * simAPI.computeSuccessProb(attacker.woundSixProb, prob) : 0;

      // # of modified AP
      result.modifAPCount = attacker.apOn6 !== '-' ? result.woundCount * simAPI.computeSuccessProb(attacker.woundSixProb, prob) : 0;

      // Unsaved wound
      let regularSave = (result.woundCount - result.modifAPCount) * (1 - simAPI.computeSuccessProb(attacker.saveProb, prob));
      if (attacker.saveOn6Prob !== undefined) {
        regularSave += result.modifAPCount * (1 - simAPI.computeSuccessProb(attacker.saveOn6Prob, prob));
      }
      const invSave = result.woundCount * (1 - simAPI.computeSuccessProb(attacker.invSaveProb, prob));
      result.unsavedWoundCount = (invSave < regularSave) ? invSave : regularSave;

      // # Damage
      result.damageSixCount = attacker.dmgOn6 !== '-' ? simAPI.computeSuccessProb(attacker.woundSixProb, prob) * attacker.dmgOn6 : 0;
      result.damageCount = attacker.dmgOn6 !== '-' ?
        (1 - simAPI.computeSuccessProb(attacker.woundSixProb, prob)) * simAPI.computeValueProb(attacker.damageProb, prob) :
        simAPI.computeValueProb(attacker.damageProb, prob);

      result.damageSixCount *= result.unsavedWoundCount;
      result.damageCount *= result.unsavedWoundCount;
      result.totalDamage = result.damageSixCount + result.damageCount + result.mortalCount;

      // FNP on regular wound
      result.fnpCount = result.totalDamage * simAPI.computeSuccessProb(attacker.fnpProb, prob);
      result.totalDamage -= result.fnpCount;

       return result;
    }

    this.attackerLst.forEach(function (attacker) {
      const result = combineProbability(attacker, localThis.properties.defender, localThis.results.probability);
      summary.shotCount += result.shotCount;
      summary.hitCount += result.hitCount;
      summary.woundCount += result.woundCount;
      summary.unsavedWoundCount += result.unsavedWoundCount;
      summary.totalDamage += result.totalDamage;
      summary.modelDead += result.modelDead;
      summary.addShotCount += result.addShotCount;
      summary.mortalCount += result.mortalCount;
      summary.modifAPCount += result.modifAPCount;
      summary.fnpCount += result.fnpCount;
      summary.damageSixCount += result.damageSixCount;
      summary.damageCount += result.damageCount;
    });

    // Compute # dead models
    summary.shotCount = summary.shotCount;
    summary.hitCount = summary.hitCount;
    summary.woundCount = summary.woundCount;
    summary.unsavedWoundCount = summary.unsavedWoundCount;
    summary.totalDamage = summary.totalDamage;
    summary.modelDead = summary.modelDead;
    summary.addShotCount = summary.addShotCount;
    summary.mortalCount = summary.mortalCount;
    summary.modifAPCount = summary.modifAPCount;
    summary.fnpCount = summary.fnpCount;
    summary.damageSixCount = summary.damageSixCount;
    summary.damageCount = summary.damageCount;

    summary.modelDead = Math.floor(summary.totalDamage / localThis.properties.defender.wounds);
    this.results = summary;
  }
}
