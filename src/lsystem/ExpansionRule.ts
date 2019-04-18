// An ExpansionRule class to represent the result of mapping a particular 
// character to a new set of characters during the grammar expansion phase of 
// the L-System. By making a class to represent the expansion, you can have a 
// single character expand to multiple possible strings depending on some 
// probability by querying a Map<string, ExpansionRule>.

import { vec3 } from 'gl-matrix';
import { exists } from 'fs';

export default class ExpansionRule {
    // A rule may contain multiple possible expansions, each of which has an 
    // associated probability: (k, v) = (probability, successor)
    precondition: string;
    expansions: Map<number, string> = new Map(); 

    constructor(oldChar: string, expansions: Map<number, string>) {
        this.precondition = oldChar;
        this.expansions = expansions;
    }

    // "Randomly" return one of the successors in the expansions map
    expand() : string {
        let sumProb = 0.0;
        let rand = Math.random();
        
        let output = "";

        // Iterate over each pair inside the expansions map, pick an expansion at "random"
        for (const [key, value] of this.expansions) {
            sumProb += key;
            if (rand < sumProb) {
                output = value;
                break;
            }
        }

        return output;
    }
}