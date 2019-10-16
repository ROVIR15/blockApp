pragma solidity ^0.5.1;

import './Voter.sol';

contract Voting {
    struct Candidate {
        string name;
        uint voteCollection;
    }
    
    struct Admin {
        bytes32 id;
        address wallet;
    }
    
    Admin[] admin;
    
    Candidate[] candidates;
    
    address[] voters;
    
    uint8 numberCandidates;
    uint8 numberVoters;
    
    bytes32 electionName;
    
    constructor(address admin, bytes32 _electionName) public{
     electionName = _electionName;
     numberCandidates = 0;
     numberVoters = 0;
    }
    
    function addAdmin(address newPerson, bytes32 id) public {
        admin.push(Admin(id, newPerson));
    }
    
    function getElectionName() public view returns(bytes32){
        return electionName;
    }
    
    function getNumberCandidate() public view returns(uint){
        uint8 length = numberCandidates;
        return length;
    }
    
    function getNumberVoters() public view returns(uint){
        uint8 length = numberVoters;
        return length;
    }
    
    function getCandidateByNum(uint8 num) public view returns(string memory){
        return candidates[num].name;
    }
    
    function getVoterByNum(uint8 num) public view returns(address){
        return voters[num]; //return voter contract address
    }
    
    function getVoterInfo(uint8 num) public returns(bytes32){
        address temp = voters[num];
        Voter voterinfo = Voter(temp);
        return voterinfo.getId();
    }
    
    function authorizedVoter(Voter ballot) public returns(bool){
        return ballot.changeAuthorize(true);
    }
    
    function createNewBallot(bytes32 _id) public returns(address){
        Voter voter = new Voter(_id);
        address temp = address(voter);
        voters.push(temp);
        numberVoters++;
        return temp;
    }
    
    function addCandidate(string memory _name) public{
        string memory nameCandidate = _name;
        uint8 seq = numberCandidates;
        candidates.push(Candidate(nameCandidate, seq));
        numberCandidates++;
    }
}