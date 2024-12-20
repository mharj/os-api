import {type DistinctKey, parseServicesLine, type ServicesEntry, servicesLineBuilder, validateLinuxServicesEntry} from '../../src/';
import {AbstractLinuxMock} from './AbstractLinuxMock';

export function buildOutput(value: ServicesEntry): string {
	const data = servicesLineBuilder(value);
	if (parseServicesLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

const rawData = `# /etc/services:
# $Id: services,v 1.49 2017/08/18 12:43:23 ovasik Exp $
#
# Network services, Internet style
# IANA services version: last updated 2021-01-19
#
# Note that it is presently the policy of IANA to assign a single well-known
# port number for both TCP and UDP; hence, most entries here have two entries
# even if the protocol doesn't support UDP operations.
# Updated from RFC 1700, ''Assigned Numbers'' (October 1994).  Not all ports
# are included, only the more common ones.
#
# The latest IANA port assignments can be gotten from
#       http://www.iana.org/assignments/port-numbers
# The Well Known Ports are those from 0 through 1023.
# The Registered Ports are those from 1024 through 49151
# The Dynamic and/or Private Ports are those from 49152 through 65535
#
# Each line describes one service, and is of the form:
#
# service-name  port/protocol  [aliases ...]   [# comment]

tcpmux          1/tcp                           # TCP port service multiplexer
tcpmux          1/udp                           # TCP port service multiplexer
rje             5/tcp                           # Remote Job Entry
rje             5/udp                           # Remote Job Entry
echo            7/tcp
echo            7/udp
discard         9/tcp           sink null
discard         9/udp           sink null
systat          11/tcp          users
systat          11/udp          users
daytime         13/tcp
daytime         13/udp
qotd            17/tcp          quote
qotd            17/udp          quote
chargen         19/tcp          ttytst source
chargen         19/udp          ttytst source
ftp-data        20/tcp
ftp-data        20/udp
# 21 is registered to ftp, but also used by fsp
ftp             21/tcp
ftp             21/udp          fsp fspd
ssh             22/tcp                          # The Secure Shell (SSH) Protocol
ssh             22/udp                          # The Secure Shell (SSH) Protocol
telnet          23/tcp
telnet          23/udp
# 24 - private mail system
lmtp            24/tcp                          # LMTP Mail Delivery
lmtp            24/udp                          # LMTP Mail Delivery
smtp            25/tcp          mail
smtp            25/udp          mail
time            37/tcp          timserver
time            37/udp          timserver
#rap             38/tcp                          # Route Access Protocol
#rap             38/udp                          # Route Access Protocol
rlp             39/tcp          resource        # resource location
rlp             39/udp          resource        # resource location
nameserver      42/tcp          name            # IEN 116
nameserver      42/udp          name            # IEN 116
nicname         43/tcp          whois
nicname         43/udp          whois
tacacs          49/tcp                          # Login Host Protocol (TACACS)
tacacs          49/udp                          # Login Host Protocol (TACACS)
re-mail-ck      50/tcp                          # Remote Mail Checking Protocol
re-mail-ck      50/udp                          # Remote Mail Checking Protocol
domain          53/tcp                          # name-domain server
domain          53/udp
whois++         63/tcp          whoispp
whois++         63/udp          whoispp`;

export class MockLinuxServices extends AbstractLinuxMock<ServicesEntry> {
	public readonly name = 'MockLinuxServices';
	protected _data = new Map<number, string>(rawData.split('\n').map((line, index) => [index, line]));

	protected toOutput(value: ServicesEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): ServicesEntry | undefined {
		return parseServicesLine(value, this.logger);
	}

	protected isSameEntry(a: ServicesEntry | DistinctKey<ServicesEntry, number>, b: ServicesEntry | DistinctKey<ServicesEntry, number> | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.service === b.service && a.port === b.port && a.protocol === b.protocol;
	}

	protected validateEntry(entry: ServicesEntry): void {
		validateLinuxServicesEntry(entry);
	}
}
