import React, { Component } from 'react';
import './index.css';
import NavBar from '../NavBar';
import variables from '../../utils/variables';
import * as PropTypes from 'prop-types';
import TokenDetails from './TokenDetails';
import DelegateDialog from '../Stake/DelegateDialog';
import SuccessDialog from '../Stake/DelegateDialog/SuccessDialog';
import UnSuccessDialog from '../Stake/DelegateDialog/UnSuccessDialog';
import ClaimDialog from './ClaimDialog';
import Table from '../Stake/Table';
import { Button, CircularProgress, Tab } from '@material-ui/core';
import Cards from '../Proposals/Cards';
import ProposalDialog from '../Proposals/ProposalDialog';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import PendingDialog from '../Stake/DelegateDialog/PendingDialog';
import { aminoSignTxAndBroadcast, cosmosSignTxAndBroadcast, signTxAndBroadcast } from '../../helper';
import { gas } from '../../defaultGasValues';
import { config } from '../../config';
import {
    fetchRewards,
    fetchVestingBalance,
    getBalance,
    getDelegations,
    getUnBondingDelegations,
} from '../../actions/accounts';

import {
    hideDelegateDialog,
    showDelegateFailedDialog,
    showDelegateProcessingDialog,
    showDelegateSuccessDialog,
} from '../../actions/stake';
import { showMessage } from '../../actions/snackbar';


class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            active: 1,
            inProgress: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleRedirect = this.handleRedirect.bind(this);
    }

    componentDidMount() {
        if ((this.props.address !== '') && (this.state.active !== 2)) {
            this.setState({
                active: 2,
            });
        }
    }

    componentDidUpdate(pp, ps, ss) {
        if ((pp.address !== this.props.address) &&
            (this.props.address !== '') && (this.state.active !== 2)) {
            this.setState({
                active: 2,
            });
        }
        if ((pp.address !== this.props.address) &&
            (this.props.address === '') && (this.state.active !== 1)) {
            this.setState({
                active: 1,
            });
        }
    }

    handleChange(value) {
        if (this.state.active === value) {
            return;
        }

        this.setState({
            active: value,
        });
    }

    handleRedirect(value) {
        this.props.history.push(value);
    }

    handleClaimTxnKeplr(address) {
        this.setState({ inProgress: true });
        let gasValue = gas.claim_reward;
        const claimTx = {
            msg: {
                typeUrl: '/passage3d.claim.v1beta1.MsgClaim',
                value: {
                    sender: address,
                    claimAction: "ActionInitialClaim"
                },
            },
            fee: {
                amount: [
                    {
                        amount: String(gasValue * config.GAS_PRICE_STEP_AVERAGE),
                        denom: config.COIN_MINIMAL_DENOM,
                    }
                ],
                gas: String(gasValue),
            },
            memo: '',
        };

        // pasg1x70xmz85f7kpqf4n20vpx8rnpj5c5c7t3vkjm5
        // const msg = {
        //     msg: {
        //         typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        //         value: {
        //             fromAddress: address,
        //             toAddress: "pasg1x70xmz85f7kpqf4n20vpx8rnpj5c5c7t3vkjm5",
        //             amount: [{
        //                 amount: "100",
        //                 denom: config.COIN_MINIMAL_DENOM
        //             }],
        //         },
        //     },
        //     fee: {
        //         amount: [
        //             {
        //                 amount: String(gasValue * config.GAS_PRICE_STEP_AVERAGE),
        //                 denom: config.COIN_MINIMAL_DENOM,
        //             }
        //         ],
        //         gas: String(gasValue),
        //     },
        //     memo: '',
        // }

        signTxAndBroadcast(claimTx, address, (error, result) => {
            this.setState({ inProgress: false });
            if (error) {
                if (error.indexOf('not yet found on the chain') > -1) {
                    this.props.pendingDialog();
                    return;
                }
                this.props.failedDialog();
                this.props.showMessage(error);
                return;
            }
            if (result) {
                this.props.successDialog(result.transactionHash);
                this.updateBalance(address);
            }
        });
    }

    updateBalance = (address) => {
        this.props.getBalance(address);
        this.props.fetchVestingBalance(address);
        this.props.getDelegations(address);
        this.props.getUnBondingDelegations(address);
        this.props.getDelegatedValidatorsDetails(address);
        this.props.fetchRewards(address);
    };

    render() {
        const { active } = this.state;
        const filteredProposals = this.props.proposals && this.props.proposals.filter((item) => item.status === 2);

        return (
            <>
                <NavBar home={true} />
                {
                    this.props.address !== '' ? <div className="home padding">
                        <div className="card">
                            <div className="left_content">
                                <h2>{variables[this.props.lang].airdrop_welcome}</h2>
                                {this.state.inProgress && <CircularProgress className="full_screen" />}
                                {
                                    this.props.claimRecord['claim_record'] && this.props.claimRecord['claim_record'].address ?
                                        <Button
                                            onClick={() => this.handleClaimTxnKeplr(this.props.claimRecord['claim_record'].address)}
                                            variant="contained"
                                        >
                                            Claim Your airdrop
                                        </Button>
                                        : "Sorry, you are not eligibnle for airdrop"
                                }
                            </div>
                        </div>
                    </div> : <div></div>
                }

                <div className="home padding">
                    <div className="card">
                        <div className="left_content">
                            <h2>{variables[this.props.lang].welcome}</h2>
                            <p className="info">{variables[this.props.lang].participate}</p>
                        </div>
                        <TokenDetails lang={this.props.lang} />
                    </div>
                </div>
                <div className="stake">
                    <div className="stake_content padding">
                        <div className="heading">
                            <div className="tabs">
                                <p className={active === 2 ? 'active' : ''} onClick={() => this.handleChange(2)}>
                                    {variables[this.props.lang]['staked_validators']}
                                </p>
                                <span />
                                <p className={active === 1 ? 'active' : ''} onClick={() => this.handleChange(1)}>
                                    {variables[this.props.lang]['all_validators']}
                                </p>
                            </div>
                            <Button className="view_all" onClick={() => this.handleRedirect('/stake')}>
                                {variables[this.props.lang]['view_all']}
                            </Button>
                        </div>
                        <Table active={active} home={true} />
                    </div>
                </div>
                <div className="proposals">
                    {!this.props.open
                        ? <div className="proposals_content padding">
                            <div className="heading">
                                <div className="tabs">
                                    <p className="active">
                                        {variables[this.props.lang]['top_active_proposals']}
                                    </p>
                                </div>
                                <Button className="view_all" onClick={() => this.handleRedirect('/proposals')}>
                                    {variables[this.props.lang]['view_all']}
                                </Button>
                            </div>
                            {this.props.proposalsInProgress || this.props.voteDetailsInProgress
                                ? <div className="cards_content">Loading...</div>
                                : filteredProposals && filteredProposals.length
                                    ? <Cards home={true} proposals={filteredProposals} />
                                    : <div className="cards_content">{variables[this.props.lang]['no_data_found']}</div>}
                        </div>
                        : <ProposalDialog />}
                </div>
                <DelegateDialog />
                <SuccessDialog />
                <UnSuccessDialog />
                <PendingDialog />
                <ClaimDialog />
            </>
        );
    }
}

Home.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func.isRequired,
    }).isRequired,
    lang: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    proposals: PropTypes.array.isRequired,
    voteDetailsInProgress: PropTypes.bool.isRequired,
    address: PropTypes.string,
    proposalsInProgress: PropTypes.bool,
};

const stateToProps = (state) => {
    return {
        claimRecord: state.accounts.claimRecord.result,
        address: state.accounts.address.value,
        lang: state.language,
        open: state.proposals.dialog.open,
        proposals: state.proposals._.list,
        proposalsInProgress: state.proposals._.inProgress,
        voteDetailsInProgress: state.proposals.voteDetails.inProgress,
    };
};

const actionToProps = {
    handleClose: hideDelegateDialog,
    successDialog: showDelegateSuccessDialog,
    failedDialog: showDelegateFailedDialog,
    pendingDialog: showDelegateProcessingDialog,
    fetchVestingBalance,
    fetchRewards,
    getBalance,
    getDelegations,
    getUnBondingDelegations,
    showMessage,
};

export default withRouter(connect(stateToProps, actionToProps)(Home));
