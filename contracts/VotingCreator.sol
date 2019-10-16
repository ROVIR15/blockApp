pragma solidity >=0.4.22 <0.5.9;

import './Voting.sol';

contract VotingCreator {

    function createVoting(address electionResponsiblePerson, bytes32 name)
        public
        returns (Voting election)
    {
        return new Voting(electionResponsiblePerson, name);
    }
    
    function addResponsiblePerson(address person, bytes32 id, Voting election) public {
        election.addAdmin(person, id);
    }
}