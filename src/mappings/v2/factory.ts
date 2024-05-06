import { log, Address } from '@graphprotocol/graph-ts';

import {
  QuestChainCreated as QuestChainCreatedEvent,
  FactorySetup as FactorySetupEvent,
  AdminReplaced as AdminReplacedEvent,
  PaymentTokenReplaced as PaymentTokenReplacedEvent,
  UpgradeFeeReplaced as UpgradeFeeReplacedEvent,
  QuestChainUpgraded as QuestChainUpgradedEvent,
  QuestChainFactoryV2 as QuestChainFactory,
} from '../../types/QuestChainFactoryV2/QuestChainFactoryV2';
import {
  QuestChainV2 as QuestChainTemplate,
  QuestChainTokenV2 as QuestChainTokenTemplate,
} from '../../types/templates';

import {
  getUser,
  getGlobal,
  getQuestChain,
  getERC20Token,
  ADDRESS_ZERO,
} from '../helpers';

import { Global } from '../../types/schema';

export function handleFactorySetup(event: FactorySetupEvent): void {
  let globalNode = getGlobal();
  setupGlobalNode(globalNode, event.address);
}

function setupGlobalNode(globalNode: Global, factoryAddress: Address): void {
  globalNode.factoryAddress = factoryAddress;

  let contract = QuestChainFactory.bind(factoryAddress);
  globalNode.templateAddress = contract.questChainTemplate();
  let tokenAddress = contract.questChainToken();
  globalNode.tokenAddress = tokenAddress;
  globalNode.adminAddress = contract.admin();
  globalNode.treasuryAddress = contract.treasury();
  let paymentTokenAddress = contract.paymentToken();
  let paymentToken = getERC20Token(paymentTokenAddress);
  globalNode.paymentToken = paymentToken.id;
  globalNode.upgradeFee = contract.upgradeFee();

  QuestChainTokenTemplate.create(tokenAddress);
  paymentToken.save();
  globalNode.save();
}

export function handleAdminReplaced(event: AdminReplacedEvent): void {
  let globalNode = getGlobal();
  globalNode.adminAddress = event.params.admin;
  globalNode.save();
}

export function handlePaymentTokenReplaced(
  event: PaymentTokenReplacedEvent,
): void {
  let globalNode = getGlobal();
  let paymentTokenAddress = event.params.paymentToken;
  let paymentToken = getERC20Token(paymentTokenAddress);
  globalNode.paymentToken = paymentToken.id;
  globalNode.save();
}

export function handleUpgradeFeeReplaced(event: UpgradeFeeReplacedEvent): void {
  let globalNode = getGlobal();
  globalNode.upgradeFee = event.params.upgradeFee;
  globalNode.save();
}

export function handleQuestChainCreated(event: QuestChainCreatedEvent): void {
  let questChain = getQuestChain(event.params.questChain);

  log.info('handleQuestChainCreated {}', [
    event.params.questChain.toHexString(),
  ]);

  let user = getUser(event.transaction.from);

  questChain.factoryAddress = event.address;
  questChain.createdAt = event.block.timestamp;
  questChain.updatedAt = event.block.timestamp;
  questChain.createdBy = user.id;
  questChain.creationTxHash = event.transaction.hash;

  questChain.version = '2';
  questChain.premium = false;

  QuestChainTemplate.create(event.params.questChain);

  let globalNode = getGlobal();

  if (globalNode.factoryAddress == ADDRESS_ZERO) {
    setupGlobalNode(globalNode, event.address);
  }

  globalNode.questChainCount = globalNode.questChainCount + 1;
  globalNode.save();

  user.save();
  questChain.save();
}

export function handleQuestChainUpgraded(event: QuestChainUpgradedEvent): void {
  let questChain = getQuestChain(event.params.questChain);

  log.info('handleQuestChainUpgraded {}', [
    event.params.questChain.toHexString(),
  ]);

  questChain.version = '2';
  questChain.premium = true;

  questChain.save();
}
