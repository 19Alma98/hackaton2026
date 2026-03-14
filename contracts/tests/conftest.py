import pytest


@pytest.fixture(scope="session")
def owner(accounts):
    return accounts[0]


@pytest.fixture(scope="session")
def alice(accounts):
    return accounts[1]


@pytest.fixture(scope="session")
def bob(accounts):
    return accounts[2]


@pytest.fixture(scope="session")
def ticket_nft(project, owner):
    return owner.deploy(project.TicketNFT, "HackTicket", "HTKT")
