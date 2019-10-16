pragma solidity >=0.5.0 <=0.7.0;

import './Voting.sol';

contract Voter {
    
    address payable owner;
    
    bytes32 id;
    bool authorized;
    bool vote;
    address election;
    
    bytes32 secret;
    uint256 candidate;
    
    Voting eventVoting;
    
    modifier ballotOwner{
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
    
    constructor(bytes32 _id, address _owner, address _election) public{
        id = _id;
        owner = _owner
        election = _election;
        authorized = false;
    }
    
    function getId() public view returns(bytes32){
        return id;
    }
    
    function changeAuthorize(bool auth) public returns(bool){
        authorized = auth;
        return(auth);
    }
    
    function commitVote(bytes32 _vote, address voter) public returns(bytes32){
        if(!authorized){
            if(!vote){
                vote = true;
                secret = keccak256(abi.encodePacked(_vote));
                return secret;
            }
            revert("You should have been used your chances");

        revert("You're not authorized by the system administrator");
    }

    function revealVote(bytes32 _secretkey, uint256 candidateid) public returns(uint256){
        if(secret != keccak256(abi.encodePacked(_secretkey))){
            candidate = candidateid;
        } else {
            candidate = 9999;
        }
        
        return candidate;
    }
}