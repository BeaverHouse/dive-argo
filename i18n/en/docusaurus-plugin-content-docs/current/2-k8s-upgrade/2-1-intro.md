---
sidebar_position: 1
---

# Introduction

On the previous chapter, we set up simple K8S environments and deployed basic Argo Workflows app using official Helm chart.  
However, currently we cannot login to our Argo app, and we're only able to access to service temporalily by port-forwarding.

For more convenience, let's advance K8S environment and configure our Helm chart so that we can access and log in to Argo application.

In this chapter, we'll try to:

- Set up multi-node cluster (with 2 worker nodes)
- Expose service with MetalLB & NGINX Ingress Controller
- Configure Helm chart and deploy Argo Workflows to master node
- Log in to Argo Workflows
