# DNS Validation Instructions for Let's Encrypt Certificate
# 
# Domain: ${domain_name}
# 
# Please create the following DNS records in your domain's DNS management console:
# 
%{ for record in validation_records ~}
# Record Type: ${record.type}
# Name: ${record.name}
# Value: ${record.record}
# TTL: 300 (or default)
# 
%{ endfor ~}
#
# After creating these records, wait 5-10 minutes for DNS propagation,
# then run: terraform apply
#
# Note: These records are only needed during certificate validation.
# They can be deleted after the certificate is issued.





















